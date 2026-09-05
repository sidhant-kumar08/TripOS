import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/common/services/prisma.service';
import { CreateExpenseDto, UpdateExpenseDto } from './dtos/expense.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async createExpense(tripId: string, userId: string, dto: CreateExpenseDto) {
    await this.verifyTripMembership(tripId, userId);

    const payerId = dto.payerId || userId;
    await this.verifyTripMembership(tripId, payerId);

    // Validate splits sum equals amount
    const splitsTotal = dto.splits.reduce((sum, s) => sum + s.amount, 0);
    if (splitsTotal !== dto.amount) {
      throw new BadRequestException(
        `Split amounts (${splitsTotal}) must equal expense amount (${dto.amount})`,
      );
    }

    for (const split of dto.splits) {
      await this.verifyTripMembership(tripId, split.userId);
    }

    const idempotencyKey = randomUUID();

    const expense = await this.prisma.expense.create({
      data: {
        tripId,
        payerId,
        description: dto.description,
        amount: Math.round(dto.amount),
        currency: dto.currency || 'INR',
        category: dto.category || 'EXPENSE',
        idempotencyKey,
        splits: {
          create: dto.splits.map((split) => ({
            userId: split.userId,
            amount: Math.round(split.amount),
          })),
        },
      } as any,
      include: {
        payer: true,
        splits: {
          include: {
            user: true,
          },
        },
      },
    });

    // Create initial audit log
    try {
      const creator = await this.prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
      const creatorName = creator?.name || creator?.email || 'Trip Member';
      const payerName = expense.payer?.name || expense.payer?.email || 'Trip Member';
      const formattedAmount = (dto.amount / 100).toFixed(2);
      
      const details = userId === payerId
        ? `Added by ${creatorName} (${dto.description} - ${dto.currency || 'INR'} ${formattedAmount})`
        : `Added by ${creatorName} on behalf of ${payerName} (${dto.description} - ${dto.currency || 'INR'} ${formattedAmount})`;

      await (this.prisma as any).expenseAuditLog.create({
        data: {
          expenseId: expense.id,
          userId,
          action: 'CREATED',
          details,
          changes: JSON.stringify({
            amount: (dto.amount / 100).toFixed(2),
            description: dto.description,
            payerId,
            category: dto.category || 'EXPENSE',
            splitsCount: dto.splits.length,
          }),
        },
      });
    } catch (e) {
      console.warn('Failed to write audit log for expense creation:', e);
    }

    // Recalculate balances
    await this.recalculateBalances(tripId);

    return this.formatExpense(expense);
  }

  async updateExpense(tripId: string, expenseId: string, userId: string, dto: UpdateExpenseDto) {
    await this.verifyTripMembership(tripId, userId);

    const existingExpense = await this.prisma.expense.findUnique({
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

    if (!existingExpense || existingExpense.tripId !== tripId) {
      throw new NotFoundException('Expense not found');
    }

    const newAmount = dto.amount !== undefined ? Math.round(dto.amount) : existingExpense.amount;
    const newDescription = dto.description !== undefined ? dto.description.trim() : existingExpense.description;
    const newCurrency = dto.currency !== undefined ? dto.currency : existingExpense.currency;
    const newCategory = dto.category !== undefined ? dto.category : (existingExpense as any).category || 'EXPENSE';
    const newPayerId = dto.payerId !== undefined ? dto.payerId : existingExpense.payerId;

    if (dto.payerId) {
      await this.verifyTripMembership(tripId, dto.payerId);
    }

    let newSplits = dto.splits;
    if (newSplits) {
      const splitsTotal = newSplits.reduce((sum, s) => sum + s.amount, 0);
      if (splitsTotal !== newAmount) {
        throw new BadRequestException(
          `Split amounts (${splitsTotal}) must equal expense amount (${newAmount})`,
        );
      }
      for (const split of newSplits) {
        await this.verifyTripMembership(tripId, split.userId);
      }
    }

    // Diff with readable units (converted from cents to actual amount)
    const diffs: Record<string, any> = {};
    if (dto.description && dto.description !== existingExpense.description) {
      diffs.description = { from: existingExpense.description, to: newDescription };
    }
    if (dto.amount !== undefined && dto.amount !== existingExpense.amount) {
      diffs.amount = {
        from: `${existingExpense.currency || 'INR'} ${(existingExpense.amount / 100).toFixed(2)}`,
        to: `${newCurrency} ${(newAmount / 100).toFixed(2)}`,
      };
    }
    if (dto.currency && dto.currency !== existingExpense.currency) {
      diffs.currency = { from: existingExpense.currency, to: newCurrency };
    }
    if (dto.payerId && dto.payerId !== existingExpense.payerId) {
      diffs.payerId = { from: existingExpense.payerId, to: newPayerId };
    }
    if (dto.splits) {
      diffs.splits = { fromCount: existingExpense.splits.length, toCount: newSplits!.length };
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (newSplits) {
        await tx.expenseSplit.deleteMany({
          where: { expenseId },
        });
        await tx.expenseSplit.createMany({
          data: newSplits.map((s) => ({
            expenseId,
            userId: s.userId,
            amount: Math.round(s.amount),
          })),
        });
      }

      const res = await tx.expense.update({
        where: { id: expenseId },
        data: {
          description: newDescription,
          amount: newAmount,
          currency: newCurrency,
          category: newCategory,
          payerId: newPayerId,
        } as any,
        include: {
          payer: true,
          splits: {
            include: {
              user: true,
            },
          },
        },
      });

      return res;
    });

    // Write audit log
    try {
      const editor = await this.prisma.user.findUnique({ where: { id: userId } });
      const changeSummary = Object.keys(diffs).length > 0
        ? `Updated ${Object.keys(diffs).join(', ')} by ${editor?.name || editor?.email || 'Member'}`
        : `Edited by ${editor?.name || editor?.email || 'Member'}`;

      await (this.prisma as any).expenseAuditLog.create({
        data: {
          expenseId,
          userId,
          action: 'UPDATED',
          details: dto.changeReason ? `${changeSummary} (Reason: ${dto.changeReason})` : changeSummary,
          changes: JSON.stringify(diffs),
        },
      });
    } catch (e) {
      console.warn('Failed to write audit log for expense update:', e);
    }

    await this.recalculateBalances(tripId);

    return this.formatExpense(updated);
  }

  async getExpenseAuditLogs(tripId: string, expenseId: string, userId: string) {
    await this.verifyTripMembership(tripId, userId);

    const expense = await this.prisma.expense.findUnique({
      where: { id: expenseId },
    });

    if (!expense || expense.tripId !== tripId) {
      throw new NotFoundException('Expense not found');
    }

    try {
      const logs = await (this.prisma as any).expenseAuditLog.findMany({
        where: { expenseId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return logs.map((log: any) => ({
        id: log.id,
        expenseId: log.expenseId,
        userId: log.userId,
        user: log.user,
        action: log.action,
        details: log.details,
        changes: log.changes ? JSON.parse(log.changes) : null,
        createdAt: log.createdAt,
      }));
    } catch (e) {
      console.warn('Failed to fetch audit logs:', e);
      return [];
    }
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

    let auditLogMap = new Map<string, number>();
    let createdByMap = new Map<string, { id: string; name: string | null; email: string }>();

    try {
      const logs = await (this.prisma as any).expenseAuditLog.findMany({
        where: {
          expenseId: { in: expenses.map((e) => e.id) },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });
      for (const log of logs) {
        auditLogMap.set(log.expenseId, (auditLogMap.get(log.expenseId) || 0) + 1);
        if (log.action === 'CREATED' && log.user && !createdByMap.has(log.expenseId)) {
          createdByMap.set(log.expenseId, {
            id: log.user.id,
            name: log.user.name,
            email: log.user.email,
          });
        }
      }
    } catch (e) {
      // Ignore if table not populated
    }

    return expenses.map((e: any) => ({
      ...this.formatExpense(e),
      addedBy: createdByMap.get(e.id) || {
        id: e.payer?.id || e.payerId,
        name: e.payer?.name || 'Member',
        email: e.payer?.email || '',
      },
      editCount: auditLogMap.get(e.id) || 1,
    }));
  }

  async deleteExpense(tripId: string, expenseId: string, userId: string) {
    await this.verifyTripMembership(tripId, userId);

    const expense = await this.prisma.expense.findUnique({
      where: { id: expenseId },
    });

    if (!expense || expense.tripId !== tripId) {
      throw new NotFoundException('Expense not found');
    }

    const tripRole = await this.prisma.tripRole.findUnique({
      where: {
        tripId_userId: {
          tripId,
          userId,
        },
      },
    });

    const isOwner = tripRole?.role === 'OWNER';
    if (expense.payerId !== userId && !isOwner) {
      throw new ForbiddenException('Only the payer or trip owner can delete an expense');
    }

    await this.prisma.expense.delete({
      where: { id: expenseId },
    });

    await this.recalculateBalances(tripId);

    return { success: true };
  }

  async getBalances(tripId: string, userId: string) {
    await this.verifyTripMembership(tripId, userId);

    const balances = await this.prisma.expenseBalance.findMany({
      where: { tripId },
    });

    const userIds = Array.from(new Set([...balances.map((b) => b.fromUserId), ...balances.map((b) => b.toUserId)]));
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    return balances.map((b: any) => ({
      fromUserId: b.fromUserId,
      fromUser: userMap.get(b.fromUserId) || { id: b.fromUserId, name: 'User' },
      toUserId: b.toUserId,
      toUser: userMap.get(b.toUserId) || { id: b.toUserId, name: 'User' },
      amount: b.balance,
    }));
  }

  async getSettlementSuggestions(tripId: string, userId: string) {
    await this.verifyTripMembership(tripId, userId);

    const balances = await this.prisma.expenseBalance.findMany({
      where: { tripId },
    });

    const userIds = Array.from(new Set([...balances.map((b) => b.fromUserId), ...balances.map((b) => b.toUserId)]));
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const netBalances = new Map<string, number>();

    for (const balance of balances) {
      const fromCurrent = netBalances.get(balance.fromUserId) || 0;
      const toCurrent = netBalances.get(balance.toUserId) || 0;

      netBalances.set(balance.fromUserId, fromCurrent - balance.balance);
      netBalances.set(balance.toUserId, toCurrent + balance.balance);
    }

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
        fromName: userMap.get(debtorId)?.name || userMap.get(debtorId)?.email || debtorId,
        to: creditorId,
        toName: userMap.get(creditorId)?.name || userMap.get(creditorId)?.email || creditorId,
        amount,
      });

      debtors[debtorIdx][1] += amount;
      creditors[creditorIdx][1] -= amount;

      if (debtors[debtorIdx][1] === 0) debtorIdx++;
      if (creditors[creditorIdx][1] === 0) creditorIdx++;
    }

    return suggestions;
  }

  private async recalculateBalances(tripId: string) {
    await this.prisma.expenseBalance.deleteMany({
      where: { tripId },
    });

    const expenses = await this.prisma.expense.findMany({
      where: { tripId },
      include: {
        splits: true,
      },
    });

    const balanceMap = new Map<string, Map<string, number>>();

    for (const expense of expenses) {
      const payerId = expense.payerId;

      for (const split of expense.splits) {
        if (split.userId === payerId) continue;

        if (!balanceMap.has(split.userId)) {
          balanceMap.set(split.userId, new Map());
        }
        const userBalances = balanceMap.get(split.userId)!;
        userBalances.set(payerId, (userBalances.get(payerId) || 0) + split.amount);
      }
    }

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
        id: expense.payer?.id || expense.payerId,
        name: expense.payer?.name || 'Member',
        email: expense.payer?.email || '',
      },
      description: expense.description,
      amount: expense.amount,
      currency: expense.currency || 'INR',
      category: expense.category || 'EXPENSE',
      splits: (expense.splits || []).map((s: any) => ({
        userId: s.userId,
        user: {
          id: s.user?.id || s.userId,
          name: s.user?.name || 'Member',
          email: s.user?.email || '',
        },
        amount: s.amount,
      })),
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
    };
  }
}
