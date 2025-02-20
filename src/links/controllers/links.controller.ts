import { 
  Controller, 
  Post, 
  Body, 
  Get, 
  Param, 
  Query, 
  Put, 
  Req,
  Res,
  HttpCode, 
  HttpException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { LinksService } from '../services/links.service';
import { CreateLinkDto } from '../dto/create-link.dto';
import { Response, Request } from 'express';

@ApiTags('links')
@Controller('links')
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Get(':shortenedUrl')
  @ApiOperation({ summary: 'Redirect to the original URL from a shortened link' })
  @ApiQuery({ name: 'password', required: false, description: 'Password if the link is protected' })
  @ApiResponse({ status: 302, description: 'Redirects to the original URL.' })
  @ApiResponse({ status: 404, description: 'Link not found or expired.' })
  @ApiResponse({ status: 403, description: 'Incorrect password.' })
  async redirect(
    @Param('shortenedUrl') shortenedUrl: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('password') password?: string,
  ) {
      const originalUrl = await this.linksService.getOriginalUrl(shortenedUrl, password, req);
      return res.redirect(302, originalUrl);
  }

  @Get(':shortenedUrl/stats') 
  @ApiOperation({ summary: 'Retrieve statistics of a shortened link' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved statistics.' })
  @ApiResponse({ status: 404, description: 'The link does not exist.' })
  async getStats(@Param('shortenedUrl') shortenedUrl: string) {
    return this.linksService.getStats(shortenedUrl);
  }

  @Post()
  @ApiOperation({ summary: 'Create a shortened link' })
  @ApiResponse({ status: 201, description: 'Shortened link successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid data provided.' })
  async create(@Body() createLinkDto: CreateLinkDto) {
    return this.linksService.createLink(createLinkDto);
  }

  @Put(':shortenedUrl/invalidate')
  @HttpCode(200) 
  @ApiOperation({ summary: 'Invalidate a shortened link' })
  @ApiResponse({ status: 200, description: 'The link has been successfully invalidated.' })
  @ApiResponse({ status: 404, description: 'The link does not exist.' })
  async invalidate(@Param('shortenedUrl') shortenedUrl: string) {
    return this.linksService.invalidateLink(shortenedUrl);
  }
}
