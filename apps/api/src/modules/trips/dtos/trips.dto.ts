import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateTripDto {
  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  destination?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}

export class InviteMemberDto {
  @IsString()
  email!: string;
}
