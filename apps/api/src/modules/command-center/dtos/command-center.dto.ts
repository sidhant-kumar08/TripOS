/**
 * @file command-center.dto.ts
 * @description Data Transfer Objects for the Trip Command Center aggregation endpoint.
 */

export interface ReadinessCheckItem {
  id: string;
  category: 'MEMBERS' | 'SCHEDULE' | 'TASKS' | 'STAY' | 'TRANSPORT' | 'FINANCES';
  label: string;
  status: 'COMPLETE' | 'IN_PROGRESS' | 'PENDING' | 'AT_RISK';
  detail: string;
}

export interface TripReadinessSummary {
  score: number; // 0 - 100 percentage
  status: 'READY' | 'NEEDS_ATTENTION' | 'IN_PLANNING';
  summaryText: string;
  checks: ReadinessCheckItem[];
  criticalTasksCompleted: number;
  criticalTasksTotal: number;
  membersConfirmedCount: number;
  membersTotalCount: number;
}

export interface AttentionItem {
  id: string;
  sourceId: string;
  sourceType: 'TASK' | 'EXPENSE' | 'ACTIVITY' | 'INVITATION';
  title: string;
  subtitle?: string;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  dueDate?: string;
  actionLabel: string;
  actionUrl: string;
}

export interface WaitingItem {
  id: string;
  sourceId: string;
  sourceType: 'TASK' | 'INVITATION';
  title: string;
  assigneeName: string;
  assigneeEmail?: string;
  assigneeAvatar?: string;
  dueDate?: string;
  status: string;
  actionUrl: string;
}

export interface NextUpItem {
  id: string;
  type: 'ACTIVITY' | 'TASK';
  title: string;
  time?: string;
  date?: string;
  location?: string;
  description?: string;
  dayLabel?: string;
  actionUrl: string;
}

export interface CommandFinancialSnapshot {
  totalSpend: number; // in cents
  currency: string;
  myNetBalance: number; // in cents (positive: is owed, negative: owes)
  myObligationSummary: string; // "You owe $X to Y" or "All settled up"
  totalExpensesCount: number;
  actionUrl: string;
}

export interface TripOverviewProgress {
  tasksCompleted: number;
  tasksTotal: number;
  activitiesCount: number;
  vaultFilesCount: number;
  membersCount: number;
  daysAway: number | null; // null if no dates, negative if completed, 0 if today, positive if future
  daysAwayLabel: string;
}

export interface TripOverviewResponseDto {
  trip: {
    id: string;
    name: string;
    description?: string | null;
    destination?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    creatorId: string;
    members: Array<{
      userId: string;
      role: string;
      user: {
        id: string;
        name?: string | null;
        email: string;
        avatar?: string | null;
      };
    }>;
  };
  readiness: TripReadinessSummary;
  myAttention: AttentionItem[];
  waitingOnOthers: WaitingItem[];
  nextUp: NextUpItem[];
  financialSnapshot: CommandFinancialSnapshot;
  progress: TripOverviewProgress;
}
