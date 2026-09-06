/**
 * @file ai.service.ts
 * @description Core service implementing the TripOS AI Layer.
 * Manages provider selection, entity resolution, validation pipeline, and ₹0 budget quotas.
 */

import { Injectable, Logger, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/common/services/prisma.service';
import { AIProvider } from './providers/ai-provider.interface';
import { GeminiProvider } from './providers/gemini.provider';
import { MockAIProvider } from './providers/mock.provider';
import { getAIConfig } from './ai.config';
import {
  RawExpenseExtraction,
  ExpenseProposal,
  RawTaskExtraction,
  TaskProposal,
  ResolvedMember,
  AskTripOSResponse,
  TripBriefingResponse,
} from './ai.types';
import {
  EXPENSE_EXTRACTION_SCHEMA,
  TASK_EXTRACTION_SCHEMA,
  BRIEFING_SCHEMA,
} from './ai.schemas';
import { EXPENSE_SYSTEM_PROMPT } from './prompts/expense.prompt';
import { TASK_SYSTEM_PROMPT } from './prompts/task.prompt';
import { ASK_TRIPOS_SYSTEM_PROMPT } from './prompts/ask.prompt';
import { BRIEFING_SYSTEM_PROMPT } from './prompts/briefing.prompt';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private provider!: AIProvider;
  private userRequestCounts = new Map<string, { count: number; date: string }>();
  private globalDailyCount = { count: 0, date: new Date().toISOString().split('T')[0] };

  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiProvider: GeminiProvider,
    private readonly mockProvider: MockAIProvider,
  ) {
    this.initProvider();
  }

  /**
   * Selects provider based on configuration and availability.
   */
  private initProvider() {
    const config = getAIConfig();
    if (config.provider === 'gemini' && this.geminiProvider.isAvailable()) {
      this.provider = this.geminiProvider;
      this.logger.log(`Active AI Provider: Google Gemini (${config.model})`);
    } else {
      this.provider = this.mockProvider;
      this.logger.log('Active AI Provider: Mock Heuristic (Zero-cost/Hermetic mode)');
    }
  }

  /**
   * Check and enforce rate limits for ₹0 budget protection.
   */
  private checkRateLimit(userId: string) {
    const config = getAIConfig();
    const today = new Date().toISOString().split('T')[0];

    // Reset global daily counter if day has passed
    if (this.globalDailyCount.date !== today) {
      this.globalDailyCount = { count: 0, date: today };
    }

    if (this.globalDailyCount.count >= config.dailyRequestLimit) {
      this.logger.warn('Global AI daily request limit reached. Gracefully falling back to mock provider.');
      this.provider = this.mockProvider;
      return;
    }

    // User limit
    const userUsage = this.userRequestCounts.get(userId);
    if (!userUsage || userUsage.date !== today) {
      this.userRequestCounts.set(userId, { count: 1, date: today });
    } else {
      if (userUsage.count >= config.perUserDailyLimit) {
        throw new BadRequestException('Daily AI quota exceeded for your account. Please try again tomorrow.');
      }
      userUsage.count += 1;
    }

    this.globalDailyCount.count += 1;
  }

  /**
   * Natural Language Expense Parser with Indian Context & Entity Resolution.
   */
  async parseExpense(tripId: string, userId: string, text: string): Promise<ExpenseProposal> {
    this.checkRateLimit(userId);

    // 1. Verify membership and fetch authorized trip members
    const members = await this.prisma.tripRole.findMany({
      where: { tripId },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    const isMember = members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('Access denied to trip records.');
    }

    const memberListContext = members
      .map((m) => `- ${m.user.name || m.user.email.split('@')[0]} (email: ${m.user.email})`)
      .join('\n');

    // 2. Call AI Provider for Structured Extraction
    const prompt = `Current Trip Members:\n${memberListContext}\n\nUser Input to Parse:\n"${text}"`;

    let raw: RawExpenseExtraction;
    try {
      raw = await this.provider.generateStructured<RawExpenseExtraction>(
        prompt,
        EXPENSE_EXTRACTION_SCHEMA,
        { systemInstruction: EXPENSE_SYSTEM_PROMPT, temperature: 0.1 },
      );
    } catch (err: any) {
      this.logger.warn(`AI Provider failed, falling back to mock parser: ${err.message}`);
      raw = await this.mockProvider.generateStructured<RawExpenseExtraction>(
        prompt,
        EXPENSE_EXTRACTION_SCHEMA,
      );
    }

    // 3. Resolve Entities (Payer & Participants) against authoritative DB records
    const requestingMember = members.find((m) => m.userId === userId)!;
    const resolvedPayer = this.resolveMember(raw.payerAlias, members, requestingMember);

    let resolvedParticipants: ResolvedMember[] = [];
    const unresolvedAliases: string[] = [];

    const isAll =
      raw.participantAliases.includes('all') ||
      raw.participantAliases.includes('everyone') ||
      raw.participantAliases.includes('sab') ||
      raw.participantAliases.length === 0;

    if (isAll) {
      resolvedParticipants = members.map((m) => ({
        id: m.userId,
        name: m.user.name || m.user.email.split('@')[0],
        email: m.user.email,
        avatar: m.user.avatar,
        matchScore: 1.0,
      }));
    } else {
      for (const alias of raw.participantAliases) {
        const resolved = this.resolveMember(alias, members, requestingMember);
        if (resolved) {
          if (!resolvedParticipants.some((p) => p.id === resolved.id)) {
            resolvedParticipants.push(resolved);
          }
        } else {
          unresolvedAliases.push(alias);
        }
      }
    }

    // Handle Exclusions (e.g. "except Rahul")
    if (raw.excludedAliases && raw.excludedAliases.length > 0) {
      for (const excl of raw.excludedAliases) {
        const exclMember = this.resolveMember(excl, members, requestingMember);
        if (exclMember) {
          resolvedParticipants = resolvedParticipants.filter((p) => p.id !== exclMember.id);
        }
      }
    }

    // 4. Invariant & Ambiguity Checks
    let needsClarification = raw.needsClarification;
    let clarificationMessage = raw.clarificationQuestion;

    if (!resolvedPayer) {
      needsClarification = true;
      clarificationMessage = `Could not identify who paid. Did you or another member pay?`;
    } else if (resolvedParticipants.length === 0) {
      needsClarification = true;
      clarificationMessage = `Who should this expense be split between?`;
    } else if (raw.amountMinor <= 0) {
      needsClarification = true;
      clarificationMessage = `Please clarify the exact amount spent.`;
    }

    return {
      rawExtraction: raw,
      amountMinor: raw.amountMinor,
      currency: raw.currency || 'INR',
      description: raw.description || 'Trip expense',
      payer: resolvedPayer,
      participants: resolvedParticipants,
      splitMode: raw.splitMode || 'EQUAL',
      confidence: raw.confidence,
      needsClarification,
      clarificationMessage,
      unresolvedAliases,
    };
  }

  /**
   * Natural Language Task Creator with Indian Context & Due Date Resolution.
   */
  async parseTask(tripId: string, userId: string, text: string): Promise<TaskProposal> {
    this.checkRateLimit(userId);

    const members = await this.prisma.tripRole.findMany({
      where: { tripId },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });

    const isMember = members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('Access denied to trip records.');
    }

    const requestingMember = members.find((m) => m.userId === userId)!;
    const memberListContext = members
      .map((m) => `- ${m.user.name || m.user.email.split('@')[0]}`)
      .join('\n');

    const todayDate = new Date().toISOString().split('T')[0];
    const prompt = `Today's Date: ${todayDate}\nTrip Members:\n${memberListContext}\n\nTask Input to Parse:\n"${text}"`;

    let raw: RawTaskExtraction;
    try {
      raw = await this.provider.generateStructured<RawTaskExtraction>(
        prompt,
        TASK_EXTRACTION_SCHEMA,
        { systemInstruction: TASK_SYSTEM_PROMPT, temperature: 0.1 },
      );
    } catch (err: any) {
      this.logger.warn(`AI Provider failed, using mock parser for task: ${err.message}`);
      raw = await this.mockProvider.generateStructured<RawTaskExtraction>(
        prompt,
        TASK_EXTRACTION_SCHEMA,
      );
    }

    // Resolve assignee
    let resolvedAssignee: ResolvedMember | null = null;
    if (raw.assigneeAlias) {
      resolvedAssignee = this.resolveMember(raw.assigneeAlias, members, requestingMember);
    }

    return {
      rawExtraction: raw,
      title: raw.title,
      assignee: resolvedAssignee,
      dueDate: raw.dueDateISO || null,
      priority: raw.priority || 'MEDIUM',
      context: raw.context,
      confidence: raw.confidence,
      needsClarification: raw.needsClarification,
      clarificationMessage: raw.clarificationQuestion,
    };
  }

  /**
   * Ask TripOS: Contextual, grounded Q&A answering strictly from authorized trip state.
   */
  async askTripOS(tripId: string, userId: string, question: string): Promise<AskTripOSResponse> {
    this.checkRateLimit(userId);

    // Verify membership
    const membership = await this.prisma.tripRole.findUnique({
      where: { tripId_userId: { tripId, userId } },
      include: { user: true },
    });
    if (!membership) throw new ForbiddenException('Access denied.');

    // Gather authorized contextual data in parallel
    const [trip, tasks, expenses, balances] = await Promise.all([
      this.prisma.trip.findUnique({
        where: { id: tripId },
        select: { name: true, destination: true, startDate: true, endDate: true },
      }),
      this.prisma.task.findMany({
        where: { tripId },
        select: { title: true, status: true, dueDate: true, assignedTo: true },
      }),
      this.prisma.expense.findMany({
        where: { tripId },
        select: { description: true, amount: true, currency: true, payerId: true },
      }),
      this.prisma.expenseBalance.findMany({
        where: {
          tripId,
          OR: [{ fromUserId: userId }, { toUserId: userId }],
        },
      }),
    ]);

    const myPendingTasks = tasks.filter((t) => t.assignedTo === userId && t.status !== 'COMPLETED');
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    const netBalanceMinor = balances.reduce((sum, b) => {
      return b.toUserId === userId ? sum + b.balance : sum - b.balance;
    }, 0);

    const contextPayload = `
Trip: "${trip?.name}" to ${trip?.destination || 'Destination TBD'}.
Start Date: ${trip?.startDate ? trip.startDate.toISOString().split('T')[0] : 'Unset'}
User's Pending Tasks: ${myPendingTasks.length > 0 ? myPendingTasks.map((t) => `"${t.title}"`).join(', ') : 'None'}
Total Trip Tasks: ${tasks.length} (${tasks.filter((t) => t.status === 'COMPLETED').length} done)
Total Group Expenses Recorded: ${(totalExpenses / 100).toFixed(2)} INR
User Net Balance: ${(netBalanceMinor / 100).toFixed(2)} INR (${netBalanceMinor >= 0 ? 'owed to you' : 'you owe others'})
`;

    const prompt = `Authorized Trip Context:\n${contextPayload}\n\nUser Question:\n"${question}"`;

    let answer: string;
    try {
      answer = await this.provider.generateText(prompt, {
        systemInstruction: ASK_TRIPOS_SYSTEM_PROMPT,
        temperature: 0.3,
      });
    } catch {
      answer = await this.mockProvider.generateText(prompt);
    }

    const suggestedActions: AskTripOSResponse['suggestedActions'] = [];
    const qLower = question.toLowerCase();
    if (qLower.includes('task') || qLower.includes('todo') || qLower.includes('pending')) {
      suggestedActions.push({ label: 'View Tasks', actionType: 'VIEW_TASK', targetPath: `/trips/${tripId}/itinerary` });
    }
    if (qLower.includes('owe') || qLower.includes('money') || qLower.includes('expense') || qLower.includes('balance')) {
      suggestedActions.push({ label: 'View Balances', actionType: 'VIEW_EXPENSE', targetPath: `/trips/${tripId}/expenses` });
    }
    if (qLower.includes('ready') || qLower.includes('status')) {
      suggestedActions.push({ label: 'Command Center', actionType: 'VIEW_READINESS', targetPath: `/trips/${tripId}` });
    }

    return {
      question,
      answer: answer.trim(),
      suggestedActions,
    };
  }

  /**
   * Command Center AI Executive Briefing.
   */
  async getBriefing(tripId: string, userId: string): Promise<TripBriefingResponse> {
    const membership = await this.prisma.tripRole.findUnique({
      where: { tripId_userId: { tripId, userId } },
    });
    if (!membership) throw new ForbiddenException('Access denied.');

    const [trip, tasks, expenses, members] = await Promise.all([
      this.prisma.trip.findUnique({ where: { id: tripId } }),
      this.prisma.task.findMany({ where: { tripId } }),
      this.prisma.expense.findMany({ where: { tripId } }),
      this.prisma.tripRole.findMany({ where: { tripId }, include: { user: true } }),
    ]);

    const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
    const pendingTasks = tasks.length - completedTasks;
    const totalSpent = (expenses.reduce((s, e) => s + e.amount, 0) / 100).toFixed(2);

    const prompt = `Trip: ${trip?.name}
Members: ${members.length}
Tasks: ${tasks.length} total (${completedTasks} done, ${pendingTasks} pending)
Total Expenses: ${totalSpent} INR`;

    try {
      const briefing = await this.provider.generateStructured<TripBriefingResponse>(
        prompt,
        BRIEFING_SCHEMA,
        { systemInstruction: BRIEFING_SYSTEM_PROMPT, temperature: 0.2 },
      );
      return {
        ...briefing,
        generatedAt: new Date().toISOString(),
      };
    } catch {
      return {
        summary: `Trip "${trip?.name}" has ${members.length} members with ${pendingTasks} open tasks.`,
        readinessNote: pendingTasks === 0 ? 'All planned tasks completed.' : `${pendingTasks} pending tasks require attention.`,
        attentionHighlight: pendingTasks > 0 ? 'Complete pending pre-trip items.' : 'Confirm travel departure timings.',
        financialHighlight: expenses.length > 0 ? `Total recorded expenses: ${totalSpent} INR.` : 'No expenses logged yet.',
        recommendedNextAction: 'Check next itinerary milestone in Command Center.',
        generatedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Fuzzy and alias-aware member resolver.
   */
  private resolveMember(
    alias: string | undefined,
    members: Array<{ userId: string; user: { id: string; name: string | null; email: string; avatar: string | null } }>,
    requestingMember: { userId: string; user: { id: string; name: string | null; email: string; avatar: string | null } },
  ): ResolvedMember | null {
    if (!alias) return null;
    const clean = alias.trim().toLowerCase();

    // 1. Self pronouns
    if (['me', 'i', 'myself', 'maine', 'mera', 'meri', 'self'].includes(clean)) {
      return {
        id: requestingMember.userId,
        name: requestingMember.user.name || requestingMember.user.email.split('@')[0],
        email: requestingMember.user.email,
        avatar: requestingMember.user.avatar,
        matchScore: 1.0,
      };
    }

    // 2. Exact or prefix match on name or email prefix
    let bestMatch: ResolvedMember | null = null;
    let highestScore = 0;

    for (const m of members) {
      const name = (m.user.name || '').toLowerCase();
      const emailPrefix = m.user.email.split('@')[0].toLowerCase();

      if (name === clean || emailPrefix === clean) {
        return {
          id: m.userId,
          name: m.user.name || m.user.email.split('@')[0],
          email: m.user.email,
          avatar: m.user.avatar,
          matchScore: 1.0,
        };
      }

      if (name.includes(clean) || clean.includes(name) || emailPrefix.includes(clean)) {
        const score = 0.8;
        if (score > highestScore) {
          highestScore = score;
          bestMatch = {
            id: m.userId,
            name: m.user.name || m.user.email.split('@')[0],
            email: m.user.email,
            avatar: m.user.avatar,
            matchScore: score,
          };
        }
      }
    }

    return bestMatch;
  }
}
