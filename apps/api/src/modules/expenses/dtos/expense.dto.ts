import { IsString, IsNumber, IsArray, IsOptional } from 'class-validator';

export class ExpenseSplitInput {
  userId!: string;
  amount!: number; // in cents
}

export class CreateExpenseDto {
  @IsString()
  description!: string;

  @IsNumber()
  amount!: number; // in cents

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  category?: string; // EXPENSE, LEND_BORROW, SETTLEMENT

  @IsString()
  @IsOptional()
  payerId?: string;

  @IsArray()
  splits!: ExpenseSplitInput[];
}

export class UpdateExpenseDto {
  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  payerId?: string;

  @IsArray()
  @IsOptional()
  splits?: ExpenseSplitInput[];

  @IsString()
  @IsOptional()
  changeReason?: string;
}
