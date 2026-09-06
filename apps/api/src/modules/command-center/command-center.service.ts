/**
 * @file command-center.service.ts
 * @description Query service for the Trip Command Center aggregation layer.
 * Deterministically aggregates trip operational state without duplicating data.
 */

import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/services/prisma.service';
import { MemoryCacheService } from '@/common/services/memory-cache.service';
import {
  TripOverviewResponseDto,
  TripReadinessSummary,
  ReadinessCheckItem,
  AttentionItem,
  WaitingItem,
  NextUpItem,
  CommandFinancialSnapshot,
  TripOverviewProgress,
} from './dtos/command-center.dto';

@Injectable()
export class CommandCenterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: MemoryCacheService,
  ) {}

  /**
   * Retrieves the unified Trip Command Center overview for a user.
   */
  async getTripOverview(tripId: string, userId: string): Promise<TripOverviewResponseDto> {
    const cacheKey = `trip:${tripId}:overview:${userId}`;
    const cached = this.cache.get<TripOverviewResponseDto>(cacheKey);
    if (cached) {
      return cached;
    }

    // 1. Fetch authoritative domain records in parallel
    const [trip, tasks, activities, expenses, vault, invitations] = await Promise.all([
      this.prisma.trip.findUnique({
        where: { id: tripId },
        include: {
          members: {
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
          },
        },
      }),
      this.prisma.task.findMany({
        where: { tripId },
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.activity.findMany({
        where: { tripId },
        orderBy: { startTime: 'asc' },
      }),
      this.prisma.expense.findMany({
        where: { tripId },
        include: {
          splits: true,
          payer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.tripVault.findUnique({
        where: { tripId },
        include: {
          files: true,
        },
      }),
      this.prisma.tripInvitation.findMany({
        where: {
          tripId,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
      }),
    ]);

    if (!trip) {
      throw new NotFoundException('Trip not found.');
    }

    const isMember = trip.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('You do not have permission to access this trip.');
    }

    const now = new Date();
    const vaultFiles = vault?.files || [];

    // Map user lookups for quick resolution
    const memberMap = new Map<string, { id: string; name?: string | null; email: string; avatar?: string | null }>();
    trip.members.forEach((m) => {
      memberMap.set(m.userId, m.user);
    });

    // 3. Compute Financial Snapshot
    const financialSnapshot = this.computeFinancialSnapshot(expenses, userId, tripId);

    // 4. Compute Readiness Score & Breakdown
    const readiness = this.computeReadiness(trip, tasks, activities, vaultFiles, expenses);

    // 5. Compute "My Attention" items
    const myAttention = this.computeMyAttention(tasks, financialSnapshot, userId, tripId, now);

    // 6. Compute "Waiting on Others" items
    const waitingOnOthers = this.computeWaitingOnOthers(tasks, invitations, memberMap, userId, tripId);

    // 7. Compute "Next Up" events & tasks
    const nextUp = this.computeNextUp(activities, tasks, tripId, now);

    // 8. Compute Progress Counters & Days Countdown
    const progress = this.computeProgress(trip, tasks, activities, vaultFiles, now);

    const overview: TripOverviewResponseDto = {
      trip: {
        id: trip.id,
        name: trip.name,
        description: trip.description,
        destination: trip.destination,
        startDate: trip.startDate ? trip.startDate.toISOString() : null,
        endDate: trip.endDate ? trip.endDate.toISOString() : null,
        creatorId: trip.creatorId,
        members: trip.members.map((m) => ({
          userId: m.userId,
          role: m.role,
          user: m.user,
        })),
      },
      readiness,
      myAttention,
      waitingOnOthers,
      nextUp,
      financialSnapshot,
      progress,
    };

    this.cache.set(cacheKey, overview, 30);
    return overview;
  }

  /**
   * Deterministically computes financial summary without modifying ledger records.
   */
  private computeFinancialSnapshot(
    expenses: any[],
    userId: string,
    tripId: string,
  ): CommandFinancialSnapshot {
    const totalSpend = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const currency = expenses[0]?.currency || 'USD';

    // Compute user's net balance: (Paid - Owed)
    const paidByUser = expenses
      .filter((exp) => exp.payerId === userId)
      .reduce((sum, exp) => sum + (exp.amount || 0), 0);

    const owedByUser = expenses
      .flatMap((exp) => exp.splits || [])
      .filter((split: any) => split.userId === userId)
      .reduce((sum: number, split: any) => sum + (split.amount || 0), 0);

    const myNetBalance = paidByUser - owedByUser;

    let myObligationSummary = 'All settled up! 🎉';
    if (myNetBalance < -100) {
      myObligationSummary = `You owe ${this.formatMoney(Math.abs(myNetBalance), currency)} in group expenses`;
    } else if (myNetBalance > 100) {
      myObligationSummary = `You are owed ${this.formatMoney(myNetBalance, currency)} from the squad`;
    }

    return {
      totalSpend,
      currency,
      myNetBalance,
      myObligationSummary,
      totalExpensesCount: expenses.length,
      actionUrl: `/trips/${tripId}/expenses`,
    };
  }

  /**
   * Evaluates operational readiness based on concrete data dimensions.
   */
  private computeReadiness(
    trip: any,
    tasks: any[],
    activities: any[],
    vaultFiles: any[],
    expenses: any[],
  ): TripReadinessSummary {
    const checks: ReadinessCheckItem[] = [];

    // 1. Members Check
    const activeMembersCount = trip.members?.length || 0;
    const hasMultipleMembers = activeMembersCount >= 2;
    checks.push({
      id: 'members',
      category: 'MEMBERS',
      label: 'Squad Joined',
      status: hasMultipleMembers ? 'COMPLETE' : 'IN_PROGRESS',
      detail: `${activeMembersCount} active traveler${activeMembersCount !== 1 ? 's' : ''}`,
    });

    // 2. Schedule Check
    const hasActivities = activities.length > 0;
    checks.push({
      id: 'schedule',
      category: 'SCHEDULE',
      label: 'Itinerary Schedule',
      status: hasActivities ? 'COMPLETE' : 'PENDING',
      detail: hasActivities ? `${activities.length} activity planned` : 'No timeline events added yet',
    });

    // 3. Tasks Check
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
    const taskStatus =
      totalTasks === 0 ? 'PENDING' : completedTasks === totalTasks ? 'COMPLETE' : 'IN_PROGRESS';
    checks.push({
      id: 'tasks',
      category: 'TASKS',
      label: 'Checklist & Responsibilities',
      status: taskStatus,
      detail: totalTasks === 0 ? 'No tasks created' : `${completedTasks}/${totalTasks} tasks completed`,
    });

    // 4. Stay / Accommodation Check
    const stayKeyword = /(stay|hotel|airbnb|villa|resort|hostel|check-in|booking|accommodation)/i;
    const hasStayActivity = activities.some((a) => stayKeyword.test(a.title) || stayKeyword.test(a.location || ''));
    const hasStayTask = tasks.some((t) => stayKeyword.test(t.title));
    const hasStayVault = vaultFiles.some((f) => stayKeyword.test(f.name));
    const stayCovered = hasStayActivity || hasStayTask || hasStayVault;
    checks.push({
      id: 'stay',
      category: 'STAY',
      label: 'Accommodation & Stay',
      status: stayCovered ? 'COMPLETE' : 'PENDING',
      detail: stayCovered ? 'Stay reservations referenced' : 'No hotel or villa added yet',
    });

    // 5. Transport Check
    const transportKeyword = /(flight|cab|taxi|train|shuttle|ferry|bus|transfer|airport|drive)/i;
    const hasTransportActivity = activities.some((a) => transportKeyword.test(a.title) || transportKeyword.test(a.location || ''));
    const hasTransportTask = tasks.some((t) => transportKeyword.test(t.title));
    const hasTransportVault = vaultFiles.some((f) => transportKeyword.test(f.name));
    const transportCovered = hasTransportActivity || hasTransportTask || hasTransportVault;
    checks.push({
      id: 'transport',
      category: 'TRANSPORT',
      label: 'Travel & Transport',
      status: transportCovered ? 'COMPLETE' : 'PENDING',
      detail: transportCovered ? 'Transport confirmed or tracked' : 'No transport bookings attached',
    });

    // 6. Finances Check
    const hasExpenses = expenses.length > 0;
    checks.push({
      id: 'finances',
      category: 'FINANCES',
      label: 'Expense Ledger',
      status: hasExpenses ? 'COMPLETE' : 'PENDING',
      detail: hasExpenses ? `${expenses.length} expense logged` : 'Ready for on-the-go logging',
    });

    // Calculate score
    const completedCount = checks.filter((c) => c.status === 'COMPLETE').length;
    const inProgressCount = checks.filter((c) => c.status === 'IN_PROGRESS').length;
    const score = Math.round(((completedCount * 1.0 + inProgressCount * 0.5) / checks.length) * 100);

    let status: 'READY' | 'NEEDS_ATTENTION' | 'IN_PLANNING' = 'IN_PLANNING';
    if (score >= 80) {
      status = 'READY';
    } else if (score >= 45) {
      status = 'NEEDS_ATTENTION';
    }

    const summaryParts: string[] = [];
    summaryParts.push(`${activeMembersCount} traveler${activeMembersCount !== 1 ? 's' : ''}`);
    if (totalTasks > 0) summaryParts.push(`${completedTasks}/${totalTasks} tasks complete`);
    if (stayCovered) summaryParts.push('stay confirmed');
    if (hasActivities) summaryParts.push(`${activities.length} activities scheduled`);

    return {
      score,
      status,
      summaryText: summaryParts.join(' · '),
      checks,
      criticalTasksCompleted: completedTasks,
      criticalTasksTotal: totalTasks,
      membersConfirmedCount: activeMembersCount,
      membersTotalCount: activeMembersCount,
    };
  }

  /**
   * Surfaces high-priority actionable items for the current user.
   */
  private computeMyAttention(
    tasks: any[],
    financialSnapshot: CommandFinancialSnapshot,
    userId: string,
    tripId: string,
    now: Date,
  ): AttentionItem[] {
    const items: AttentionItem[] = [];

    // Filter tasks assigned to current user that are not completed
    const myIncompleteTasks = tasks.filter(
      (t) => t.assignedTo === userId && t.status !== 'COMPLETED' && t.status !== 'CANCELLED',
    );

    for (const task of myIncompleteTasks) {
      let urgency: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
      let subtitle = 'Assigned to you';

      if (task.dueDate) {
        const due = new Date(task.dueDate);
        const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
          urgency = 'HIGH';
          subtitle = `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
        } else if (diffDays <= 2) {
          urgency = 'MEDIUM';
          subtitle = diffDays === 0 ? 'Due today' : `Due in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
        } else {
          subtitle = `Due in ${diffDays} days`;
        }
      }

      items.push({
        id: `task-${task.id}`,
        sourceId: task.id,
        sourceType: 'TASK',
        title: task.title,
        subtitle,
        urgency,
        dueDate: task.dueDate ? task.dueDate.toISOString() : undefined,
        actionLabel: 'Complete Task',
        actionUrl: `/trips/${tripId}/tasks`,
      });
    }

    // Financial obligation attention
    if (financialSnapshot.myNetBalance < -500) {
      items.push({
        id: `fin-settle-${tripId}`,
        sourceId: tripId,
        sourceType: 'EXPENSE',
        title: 'Outstanding Group Expenses',
        subtitle: `You owe ${this.formatMoney(Math.abs(financialSnapshot.myNetBalance), financialSnapshot.currency)}`,
        urgency: 'MEDIUM',
        actionLabel: 'Settle Up',
        actionUrl: `/trips/${tripId}/expenses`,
      });
    }

    // Sort: HIGH > MEDIUM > LOW
    const urgencyOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    items.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

    // Limit to top 5 items to avoid overload
    return items.slice(0, 5);
  }

  /**
   * Surfaces items blocked on other specific members.
   */
  private computeWaitingOnOthers(
    tasks: any[],
    invitations: any[],
    memberMap: Map<string, any>,
    userId: string,
    tripId: string,
  ): WaitingItem[] {
    const items: WaitingItem[] = [];

    // Other members' open tasks
    const othersTasks = tasks.filter(
      (t) => t.assignedTo && t.assignedTo !== userId && t.status !== 'COMPLETED' && t.status !== 'CANCELLED',
    );

    for (const task of othersTasks) {
      const assignee = memberMap.get(task.assignedTo);
      items.push({
        id: `waiting-task-${task.id}`,
        sourceId: task.id,
        sourceType: 'TASK',
        title: task.title,
        assigneeName: assignee?.name || assignee?.email || 'Squad Member',
        assigneeEmail: assignee?.email,
        assigneeAvatar: assignee?.avatar,
        dueDate: task.dueDate ? task.dueDate.toISOString() : undefined,
        status: task.status,
        actionUrl: `/trips/${tripId}/tasks`,
      });
    }

    // Pending sent invitations
    for (const invite of invitations) {
      items.push({
        id: `waiting-invite-${invite.id}`,
        sourceId: invite.id,
        sourceType: 'INVITATION',
        title: `Awaiting invitation response`,
        assigneeName: invite.email,
        assigneeEmail: invite.email,
        status: 'INVITED',
        actionUrl: `/trips/${tripId}`,
      });
    }

    // Limit to top 5 items
    return items.slice(0, 5);
  }

  /**
   * Extracts next upcoming activities and milestones.
   */
  private computeNextUp(
    activities: any[],
    tasks: any[],
    tripId: string,
    now: Date,
  ): NextUpItem[] {
    const items: NextUpItem[] = [];

    // Next 3 upcoming activities
    const upcomingActivities = activities
      .filter((a) => new Date(a.startTime).getTime() >= now.getTime() - 4 * 3600 * 1000) // Include recent activity up to 4h ago
      .slice(0, 3);

    // If all activities are in the future or past, pick first 3
    const selectedActivities = upcomingActivities.length > 0 ? upcomingActivities : activities.slice(0, 3);

    for (const act of selectedActivities) {
      const start = new Date(act.startTime);
      items.push({
        id: `activity-${act.id}`,
        type: 'ACTIVITY',
        title: act.title,
        time: start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: start.toLocaleDateString([], { month: 'short', day: 'numeric' }),
        location: act.location || undefined,
        description: act.description || undefined,
        dayLabel: start.toLocaleDateString([], { weekday: 'short' }),
        actionUrl: `/trips/${tripId}/itinerary`,
      });
    }

    // If few activities, include next upcoming tasks with due dates
    if (items.length < 3) {
      const upcomingTasks = tasks
        .filter((t) => t.status !== 'COMPLETED' && t.dueDate)
        .slice(0, 3 - items.length);

      for (const t of upcomingTasks) {
        const due = new Date(t.dueDate);
        items.push({
          id: `task-milestone-${t.id}`,
          type: 'TASK',
          title: t.title,
          date: due.toLocaleDateString([], { month: 'short', day: 'numeric' }),
          dayLabel: 'Due',
          actionUrl: `/trips/${tripId}/tasks`,
        });
      }
    }

    return items;
  }

  /**
   * Computes high-level progress counters and countdown days.
   */
  private computeProgress(
    trip: any,
    tasks: any[],
    activities: any[],
    vaultFiles: any[],
    now: Date,
  ): TripOverviewProgress {
    const tasksTotal = tasks.length;
    const tasksCompleted = tasks.filter((t) => t.status === 'COMPLETED').length;

    let daysAway: number | null = null;
    let daysAwayLabel = 'Dates not set';

    if (trip.startDate) {
      const start = new Date(trip.startDate);
      const end = trip.endDate ? new Date(trip.endDate) : null;
      const diffTime = start.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      daysAway = diffDays;
      if (diffDays > 1) {
        daysAwayLabel = `${diffDays} days away`;
      } else if (diffDays === 1) {
        daysAwayLabel = 'Tomorrow';
      } else if (diffDays === 0) {
        daysAwayLabel = 'Today';
      } else if (end && now.getTime() <= end.getTime()) {
        daysAwayLabel = 'Happening now 🌴';
      } else {
        daysAwayLabel = 'Completed';
      }
    }

    return {
      tasksCompleted,
      tasksTotal,
      activitiesCount: activities.length,
      vaultFilesCount: vaultFiles.length,
      membersCount: trip.members?.length || 0,
      daysAway,
      daysAwayLabel,
    };
  }

  /**
   * Formats cents into clean currency string.
   */
  private formatMoney(cents: number, currency: string): string {
    const amount = cents / 100;
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase(),
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${currency.toUpperCase()} ${amount.toFixed(2)}`;
    }
  }
}
