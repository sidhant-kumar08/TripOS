import { IsString, IsInt, Min, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ExpenseSplitInput {
  @IsString()
  userId!: string;

  @IsInt()
  @Min(0, { message: 'Split amount must not be negative' })
  amount!: number; // in cents
}

export class CreateExpenseDto {
  @IsString()
  description!: string;

  @IsInt()
  @Min(1, { message: 'Expense amount must be at least 1 minor unit / paisa' })
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
  @ValidateNested({ each: true })
  @Type(() => ExpenseSplitInput)
  splits!: ExpenseSplitInput[];
}

export class UpdateExpenseDto {
  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(1, { message: 'Expense amount must be at least 1 minor unit / paisa' })
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
  @ValidateNested({ each: true })
  @Type(() => ExpenseSplitInput)
  @IsOptional()
  splits?: ExpenseSplitInput[];

  @IsString()
  @IsOptional()
  changeReason?: string;
}
