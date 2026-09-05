import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadFileDto {
  @ApiProperty({ description: 'File name with extension', example: 'flight-tickets.pdf' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'MIME type of the file', example: 'application/pdf' })
  @IsString()
  mimeType!: string;

  @ApiPropertyOptional({ description: 'File size in bytes', example: 102400 })
  @IsNumber()
  @IsOptional()
  size?: number;

  @ApiPropertyOptional({ description: 'Base64 encoded file data (optional for direct upload)' })
  @IsString()
  @IsOptional()
  fileData?: string;
}

export class UpdateFileDto {
  @ApiPropertyOptional({ description: 'New file name', example: 'hotel-reservation-updated.pdf' })
  @IsString()
  @IsOptional()
  name?: string;
}
