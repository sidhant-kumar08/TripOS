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
  startDate!: string;

  @IsDateString()
  endDate!: string;
}

export class InviteMemberDto {
  @IsString()
  email!: string;
}
