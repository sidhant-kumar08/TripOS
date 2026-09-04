import { IsString, IsOptional } from 'class-validator';

export class UploadFileDto {
  @IsString()
  name!: string;

  @IsString()
  mimeType!: string;

  @IsOptional()
  size?: number;
}

export class UpdateFileDto {
  @IsString()
  @IsOptional()
  name?: string;
}
