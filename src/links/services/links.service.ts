import { Injectable, Logger, NotFoundException, ForbiddenException, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Link } from '../entities/link.entity';
import * as bcrypt from 'bcrypt';
import * as child_process from 'child_process';
import { randomBytes } from 'crypto';
import { CreateLinkDto } from '../dto/create-link.dto';
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

  async getOriginalUrl(shortenedUrl: string, password?: string, req?: Request): Promise<string> {
    const link = await this.validateLink(shortenedUrl, password);

    link.clicks += 1;
    await this.linkRepository.save(link);

    const isBrowser = await this.isBrowserRequest(req);
  if (!isBrowser) {
    this.openInSystemBrowser(link.originalUrl);
  }

    return link.originalUrl;
  }

  async getStats(shortenedUrl: string): Promise<object> {
    const link = await this.linkRepository.findOne({ where: { shortenedUrl } });

    if (!link) {
      throw new NotFoundException('The link does not exist.');
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
      this.logger.warn(`Attempted to invalidate a non-existent link: ${shortenedUrl}`);
      throw new NotFoundException('The link does not exist.');
    }

    link.isValid = false;
    await this.linkRepository.save(link);

    return { message: 'The link has been successfully invalidated.' };
  }

  private async validateLink(shortenedUrl: string, password?: string): Promise<Link> {
    const link = await this.linkRepository.findOne({ where: { shortenedUrl } });

    if (!link) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'Not Found',
        message: 'The link does not exist.',
      });
    }

    if (!link.isValid) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        message: 'This link has been invalidated.',
      });
    }

    if (link.expirationDate && new Date() > link.expirationDate) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        message: 'This link has expired.',
      });
    }
    if (link.passwordHash) {
      if (!password) {
        throw new ForbiddenException({
          statusCode: 403,
          error: 'Forbidden',
          message: 'This link is password protected. Please provide a password.',
        });
      }
  
      const isPasswordValid = await bcrypt.compare(password, link.passwordHash);
      if (!isPasswordValid) {
        throw new ForbiddenException({
          statusCode: 403,
          error: 'Forbidden',
          message: 'Incorrect password.',
         
          });
      }}
    return link;
  }

  async isBrowserRequest(req: Request): Promise<boolean> {
    const userAgent = req.headers['user-agent'] || '';
    const referer = req.headers['referer'] || '';

    const isSwaggerOrPostman = referer.includes('/api') || /Swagger|PostmanRuntime/i.test(userAgent);
    const isBrowser = /Mozilla|Chrome|Safari|Firefox|Edge/i.test(userAgent) && !isSwaggerOrPostman;

    return isBrowser;
  }

  openInSystemBrowser(url: string): void {
    if (process.env.NODE_ENV === 'test') {
      return; 
    }
    const command = process.platform === 'win32' ? `start ${url}` : `open "${url}"`;
    child_process.exec(command);
  }

}  
