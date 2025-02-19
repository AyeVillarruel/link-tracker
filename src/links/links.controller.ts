import { Controller, Post, Body, Get, Param, Query, Res, Put, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { LinksService } from './links.service';
import { CreateLinkDto } from './dto/create-link.dto';
import { Response, Request } from 'express';

@ApiTags('links') 
@Controller('links')
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un link acortado' })
  @ApiResponse({ status: 201, description: 'Link acortado creado correctamente.', 
    schema: {
      example: {
        link: "http://localhost:3000/links/aBsJu",
        shortenedUrl: "aBsJu",
        target: "https://www.fierastudio.com",
        valid: true
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  async create(@Body() createLinkDto: CreateLinkDto) {
    return this.linksService.createLink(createLinkDto);
  }

  @Get(':shortenedUrl')
  @ApiOperation({ summary: 'Redirige a la URL original a partir de un enlace acortado' })
  @ApiQuery({ name: 'password', required: false, description: 'Contraseña si el enlace está protegido' })
  @ApiResponse({ status: 302, description: 'Redirige a la URL original.' })
  @ApiResponse({ status: 404, description: 'Enlace no encontrado o expirado.' })
  @ApiResponse({ status: 403, description: 'Contraseña incorrecta.' })
  async redirect(
    @Param('shortenedUrl') shortenedUrl: string,
    @Query('password') password: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const originalUrl = await this.linksService.getOriginalUrl(shortenedUrl, password);
      const isBrowser = await this.linksService.isBrowserRequest(req);

      if (isBrowser) {
        return res.redirect(originalUrl);
      }

      this.linksService.openInSystemBrowser(originalUrl);
      return res.status(302).set('Location', originalUrl).send();
    } catch (error) {
      return res.status(error.getStatus ? error.getStatus() : 500).json({
        statusCode: error.getStatus ? error.getStatus() : 500,
        message: error.message,
      });
    }
  }

  @Get(':shortenedUrl/stats')
  @ApiOperation({ summary: 'Obtener estadísticas de un enlace acortado' })
  @ApiResponse({ status: 200, description: 'Estadísticas obtenidas exitosamente.' })
  @ApiResponse({ status: 404, description: 'El enlace no existe.' })
  async getStats(@Param('shortenedUrl') shortenedUrl: string) {
    return this.linksService.getStats(shortenedUrl);
  }

  @Put(':shortenedUrl/invalidate')
  @ApiOperation({ summary: 'Invalidar un enlace acortado' })
  @ApiResponse({ status: 200, description: 'El enlace ha sido invalidado.', 
    schema: {
      example: { message: "El enlace ha sido invalidado exitosamente." }
    }
  })
  @ApiResponse({ status: 404, description: 'El enlace no existe.' })
  async invalidate(@Param('shortenedUrl') shortenedUrl: string) {
    return this.linksService.invalidateLink(shortenedUrl);
  }
}
