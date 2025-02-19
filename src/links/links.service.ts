import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Link } from './entities/link.entity';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { CreateLinkDto } from './dto/create-link.dto';
import * as child_process from 'child_process';
import { Request } from 'express';

@Injectable()
export class LinksService {
  private readonly logger = new Logger(LinksService.name);

  constructor(
    @InjectRepository(Link)
    private readonly linkRepository: Repository<Link>,
  ) {}

  async createLink(dto: CreateLinkDto): Promise<{ link: string; shortenedUrl: string; target: string; valid: boolean }> {
    const shortenedUrl = randomBytes(5).toString('hex');
    const passwordHash = dto.password ? await bcrypt.hash(dto.password, 10) : null;
    const expirationDate = dto.expirationDate ? new Date(dto.expirationDate) : null;

    const newLink = this.linkRepository.create({
      originalUrl: dto.originalUrl,
      shortenedUrl,
      passwordHash,
      expirationDate,
    });

    await this.linkRepository.save(newLink);

    return {
      link: `http://localhost:3000/links/${shortenedUrl}`,
      shortenedUrl, 
      target: dto.originalUrl, 
      valid: true, 
    };
}


  async getOriginalUrl(shortenedUrl: string, password?: string): Promise<string> {
    const link = await this.linkRepository.findOne({ where: { shortenedUrl } });

    if (!link) {
      this.logger.warn(`Enlace no encontrado: ${shortenedUrl}`);
      throw new NotFoundException('El enlace no existe.');
    }

    if (!link.isValid) {
      throw new NotFoundException('Este enlace ha sido invalidado.');
    }

    if (link.expirationDate && new Date() > link.expirationDate) {
      throw new NotFoundException('Este enlace ha expirado.');
    }

    if (link.passwordHash) {
      if (!password) {
        throw new ForbiddenException('Este enlace requiere una contraseña.');
      }

      const isPasswordValid = await bcrypt.compare(password, link.passwordHash);
      if (!isPasswordValid) {
        throw new ForbiddenException('Contraseña incorrecta.');
      }
    }

    link.clicks += 1;
    await this.linkRepository.save(link);

    return link.originalUrl;
}

  async getStats(shortenedUrl: string): Promise<object> {
    const link = await this.linkRepository.findOne({ where: { shortenedUrl } });

    if (!link) {
      throw new NotFoundException('El enlace no existe.');
    }

    return {
      shortenedUrl: link.shortenedUrl,
      originalUrl: link.originalUrl,
      clicks: link.clicks,
      isValid: link.isValid,
      createdAt: link.createdAt,
      expirationDate: link.expirationDate,
    };
  }

  async invalidateLink(shortenedUrl: string): Promise<{ message: string }> {
    const link = await this.linkRepository.findOne({ where: { shortenedUrl } });

    if (!link) {
      this.logger.warn(`Intento de invalidar un link inexistente: ${shortenedUrl}`);
      throw new NotFoundException('El enlace no existe.');
    }

    link.isValid = false;
    await this.linkRepository.save(link);

    return { message: 'El enlace ha sido invalidado exitosamente.' };
  }

  async isBrowserRequest(req: Request): Promise<boolean> {
    const userAgent = req.headers['user-agent'] || '';
    const referer = req.headers['referer'] || '';

    const isSwagger = referer.includes('/api') || /Swagger|PostmanRuntime/i.test(userAgent);
    const isBrowser = /Mozilla|Chrome|Safari|Firefox|Edge/i.test(userAgent) && !isSwagger;

    return isBrowser;
  }

  openInSystemBrowser(url: string): void {
    const command = process.platform === 'win32' ? `start ${url}` : `open "${url}"`;
    child_process.exec(command);
  }
}
