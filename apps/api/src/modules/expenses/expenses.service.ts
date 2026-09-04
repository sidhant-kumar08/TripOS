import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/common/services/prisma.service';
import { CreateExpenseDto } from './dtos/expense.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async createExpense(tripId: string, userId: string, dto: CreateExpenseDto) {
    // Verify user is a member
    await this.verifyTripMembership(tripId, userId);

    // Validate splits sum equals amount
    const splitsTotal = dto.splits.reduce((sum, s) => sum + s.amount, 0);
    if (splitsTotal !== dto.amount) {
      throw new BadRequestException(
        `Split amounts (${splitsTotal}) must equal expense amount (${dto.amount})`,
      );
    }

    // Verify all split participants are trip members
    for (const split of dto.splits) {
      await this.verifyTripMembership(tripId, split.userId);
    }

    const idempotencyKey = randomUUID();

    // Create expense with splits in a transaction
    const expense = await this.prisma.expense.create({
      data: {
        tripId,
        payerId: userId,
        description: dto.description,
        amount: Math.round(dto.amount),
        currency: dto.currency || 'USD',
        idempotencyKey,
        splits: {
          create: dto.splits.map((split) => ({
            userId: split.userId,
            amount: Math.round(split.amount),
          })),
        },
      },
      include: {
        payer: true,
        splits: {
          include: {
            user: true,
          },
        },
      },
    });

    // Recalculate balances
    await this.recalculateBalances(tripId);

    return this.formatExpense(expense);
  }

  async getExpense(tripId: string, expenseId: string, userId: string) {
    await this.verifyTripMembership(tripId, userId);

    const expense = await this.prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        payer: true,
        splits: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!expense || expense.tripId !== tripId) {
      throw new NotFoundException('Expense not found');
    }

    return this.formatExpense(expense);
  }

  async listExpenses(tripId: string, userId: string) {
    await this.verifyTripMembership(tripId, userId);

    const expenses = await this.prisma.expense.findMany({
      where: { tripId },
      include: {
        payer: true,
        splits: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return expenses.map((e: any) => this.formatExpense(e));
  }

  async deleteExpense(tripId: string, expenseId: string, userId: string) {
    await this.verifyTripMembership(tripId, userId);

    const expense = await this.prisma.expense.findUnique({
      where: { id: expenseId },
    });

    if (!expense || expense.tripId !== tripId) {
      throw new NotFoundException('Expense not found');
    }

    if (expense.payerId !== userId) {
      throw new ForbiddenException('Only the payer can delete an expense');
    }

    // Delete expense (splits cascade delete)
    await this.prisma.expense.delete({
      where: { id: expenseId },
    });

    // Recalculate balances
    await this.recalculateBalances(tripId);

    return { success: true };
  }

  async getBalances(tripId: string, userId: string) {
    await this.verifyTripMembership(tripId, userId);

    const balances = await this.prisma.expenseBalance.findMany({
      where: { tripId },
    });

    return balances.map((b: any) => ({
      fromUserId: b.fromUserId,
      toUserId: b.toUserId,
      amount: b.balance, // positive means from owes to
    }));
  }

  async getSettlementSuggestions(tripId: string, userId: string) {
    await this.verifyTripMembership(tripId, userId);

    // Get all balances for the trip
    const balances = await this.prisma.expenseBalance.findMany({
      where: { tripId },
    });

    // Collect net balances for each user
    const netBalances = new Map<string, number>();

    for (const balance of balances) {
      const fromCurrent = netBalances.get(balance.fromUserId) || 0;
      const toCurrent = netBalances.get(balance.toUserId) || 0;

      netBalances.set(balance.fromUserId, fromCurrent - balance.balance);
      netBalances.set(balance.toUserId, toCurrent + balance.balance);
    }

    // Generate suggestions
    const suggestions: any[] = [];
    const debtors = Array.from(netBalances.entries())
      .filter(([, amount]) => amount < 0)
      .sort((a, b) => a[1] - b[1]);

    const creditors = Array.from(netBalances.entries())
      .filter(([, amount]) => amount > 0)
      .sort((a, b) => b[1] - a[1]);

    let debtorIdx = 0;
    let creditorIdx = 0;

    while (debtorIdx < debtors.length && creditorIdx < creditors.length) {
      const [debtorId, debtAmount] = debtors[debtorIdx];
      const [creditorId, creditAmount] = creditors[creditorIdx];

      const amount = Math.min(Math.abs(debtAmount), creditAmount);

      suggestions.push({
        from: debtorId,
        to: creditorId,
        amount,
      });

      debtors[debtorIdx][1] += amount; // reduce debt
      creditors[creditorIdx][1] -= amount; // reduce credit

      if (debtors[debtorIdx][1] === 0) debtorIdx++;
      if (creditors[creditorIdx][1] === 0) creditorIdx++;
    }

    return suggestions;
  }

  private async recalculateBalances(tripId: string) {
    // Clear existing balances
    await this.prisma.expenseBalance.deleteMany({
      where: { tripId },
    });

    // Get all expenses for trip
    const expenses = await this.prisma.expense.findMany({
      where: { tripId },
      include: {
        splits: true,
      },
    });

    // Calculate balances
    const balanceMap = new Map<string, Map<string, number>>();

    for (const expense of expenses) {
      const payerId = expense.payerId;

      for (const split of expense.splits) {
        if (split.userId === payerId) continue; // Skip if payer is in splits

        // split.userId owes payerId
        if (!balanceMap.has(split.userId)) {
          balanceMap.set(split.userId, new Map());
        }
        const userBalances = balanceMap.get(split.userId)!;
        userBalances.set(payerId, (userBalances.get(payerId) || 0) + split.amount);
      }
    }

    // Insert balances into database
    const balancesToCreate: any[] = [];
    for (const [fromUserId, userBalances] of balanceMap.entries()) {
      for (const [toUserId, amount] of userBalances.entries()) {
        balancesToCreate.push({
          tripId,
          fromUserId,
          toUserId,
          balance: amount,
        });
      }
    }

    if (balancesToCreate.length > 0) {
      await this.prisma.expenseBalance.createMany({
        data: balancesToCreate,
      });
    }
  }

  private async verifyTripMembership(tripId: string, userId: string) {
    const membership = await this.prisma.tripRole.findUnique({
      where: {
        tripId_userId: {
          tripId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this trip');
    }
  }

  private formatExpense(expense: any) {
    return {
      id: expense.id,
      tripId: expense.tripId,
      payerId: expense.payerId,
      payer: {
        id: expense.payer.id,
        name: expense.payer.name,
        email: expense.payer.email,
      },
      description: expense.description,
      amount: expense.amount,
      currency: expense.currency,
      splits: expense.splits.map((s: any) => ({
        userId: s.userId,
        user: {
          id: s.user.id,
          name: s.user.name,
          email: s.user.email,
        },
        amount: s.amount,
      })),
      createdAt: expense.createdAt,
    };
  }
}
