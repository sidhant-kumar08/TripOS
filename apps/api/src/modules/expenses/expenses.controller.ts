import {
  Controller,
  Post,
  Put,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto, UpdateExpenseDto } from './dtos/expense.dto';
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

  @Get('overview')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get unified expenses overview (trip, expenses, balances, settlements) in 1 call' })
  async getExpensesOverview(@Param('tripId') tripId: string, @Req() req: any) {
    return this.expensesService.getExpensesOverview(tripId, req.user.sub);
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

  @Put(':expenseId')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an expense with audit log' })
  async updateExpense(
    @Param('tripId') tripId: string,
    @Param('expenseId') expenseId: string,
    @Req() req: any,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expensesService.updateExpense(tripId, expenseId, req.user.sub, dto);
  }

  @Get(':expenseId/history')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get edit audit history for an expense' })
  async getExpenseHistory(
    @Param('tripId') tripId: string,
    @Param('expenseId') expenseId: string,
    @Req() req: any,
  ) {
    return this.expensesService.getExpenseAuditLogs(tripId, expenseId, req.user.sub);
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
}
