import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dtos/expense.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';

@ApiTags('expenses')
@Controller('trips/:tripId/expenses')
export class ExpensesController {
  constructor(private expensesService: ExpensesService) {}

  @Post()
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an expense' })
  async createExpense(
    @Param('tripId') tripId: string,
    @Req() req: any,
    @Body() dto: CreateExpenseDto,
  ) {
    return this.expensesService.createExpense(tripId, req.user.sub, dto);
  }

  @Get()
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all expenses in a trip' })
  async listExpenses(@Param('tripId') tripId: string, @Req() req: any) {
    return this.expensesService.listExpenses(tripId, req.user.sub);
  }

  @Get(':expenseId')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get expense details' })
  async getExpense(
    @Param('tripId') tripId: string,
    @Param('expenseId') expenseId: string,
    @Req() req: any,
  ) {
    return this.expensesService.getExpense(tripId, expenseId, req.user.sub);
  }

  @Delete(':expenseId')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an expense' })
  async deleteExpense(
    @Param('tripId') tripId: string,
    @Param('expenseId') expenseId: string,
    @Req() req: any,
  ) {
    return this.expensesService.deleteExpense(tripId, expenseId, req.user.sub);
  }

  @Get('balances/all')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all balances in a trip' })
  async getBalances(@Param('tripId') tripId: string, @Req() req: any) {
    return this.expensesService.getBalances(tripId, req.user.sub);
  }

  @Get('settlement/suggestions')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get settlement suggestions' })
  async getSettlementSuggestions(@Param('tripId') tripId: string, @Req() req: any) {
    return this.expensesService.getSettlementSuggestions(tripId, req.user.sub);
  }
}
