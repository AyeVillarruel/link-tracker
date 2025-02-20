import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUrl, IsDateString } from 'class-validator';

export class CreateLinkDto {
  @ApiProperty({ example: 'https://mywebsite.com', description: 'URL to shorten' })
  @IsNotEmpty()
  @IsUrl()
  originalUrl: string;

  @ApiPropertyOptional({ example: 'secure123', description: 'Optional password' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ example: '2025-02-28T00:00:00.000Z', description: 'Optional expiration date' })
  @IsOptional()
  @IsDateString()
  expirationDate?: string;
}
