import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUrl, IsDateString } from 'class-validator';

export class CreateLinkDto {
  @ApiProperty({ example: 'https://miweb.com', description: 'URL a acortar' })
  @IsNotEmpty()
  @IsUrl()
  originalUrl: string;

  @ApiPropertyOptional({ example: 'segura123', description: 'Contraseña opcional' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ example: '2025-02-28T00:00:00.000Z', description: 'Fecha de expiración opcional' })
  @IsOptional()
  @IsDateString()
  expirationDate?: string;
}
