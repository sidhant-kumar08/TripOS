import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UploadFileDto {
  @ApiPropertyOptional({ description: 'File name with extension', example: 'flight-tickets.pdf' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'MIME type of the file', example: 'application/pdf' })
  @IsString()
  @IsOptional()
  mimeType?: string;

  @ApiPropertyOptional({ description: 'File size in bytes', example: 102400 })
  @IsOptional()
  size?: number | string;

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
