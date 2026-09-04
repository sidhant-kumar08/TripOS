import { IsString, IsOptional, IsDateString, IsArray } from 'class-validator';

export class CreateActivityDto {
  @IsString()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsDateString()
  startTime!: string;

  @IsDateString()
  @IsOptional()
  endTime?: string;

  @IsArray()
  @IsOptional()
  participantIds?: string[];
}

export class UpdateActivityDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsDateString()
  @IsOptional()
  startTime?: string;

  @IsDateString()
  @IsOptional()
  endTime?: string;
}

export class UpdateActivityParticipantDto {
  @IsString()
  status!: 'ATTENDING' | 'NOT_ATTENDING' | 'MAYBE';
}
