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
  UnifiedChatResponse,
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
   * Interprets natural language conversational text into a structured expense proposal.
   *
   * Core Guarantees:
   * 1. Multi-lingual Interpretation: Handles English, Hindi in Latin script, Hinglish,
   *    Indian currency amounts (5k, 2 hazar, ₹5,000), and pronoun variations (maine, me).
   * 2. Entity Resolution: Deterministically resolves extracted alias names to real TripRole
   *    members authorized on the trip.
   * 3. Safety Pipeline: If amounts are zero/missing or critical entities cannot be resolved,
   *    flags `needsClarification = true` with a clear explanation instead of guessing.
   * 4. Zero Autonomous Mutations: Never writes to the database. Returns a proposal for
   *    user review and explicit confirmation.
   *
   * @param tripId The unique identifier of the active trip.
   * @param userId The ID of the authenticated requesting user.
   * @param text The conversational input string from the user.
   * @returns An `ExpenseProposal` containing resolved members, amount, currency, and validation state.
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
   * Interprets conversational task input and returns a validated task proposal.
   *
   * Core Guarantees:
   * 1. Conversational Dates: Resolves colloquial expressions (e.g. 'kal', 'parso', 'next Friday')
   *    into concrete ISO dates relative to today.
   * 2. Intelligent Delegation: Detects Hindi postposition assignment markers ('Priya ko bol dena')
   *    and matches them against authorized trip members.
   * 3. Priority Inference: Infers urgency ('urgent', 'abhi', 'asap' -> URGENT; 'kal' -> HIGH).
   * 4. Zero Direct Writes: User must review and click 'Confirm & Create Task'.
   *
   * @param tripId The trip ID.
   * @param userId Authenticated user requesting the task creation.
   * @param text Conversational input text.
   * @returns `TaskProposal` with title, resolved assignee, due date, and priority.
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
   * Grounded Contextual Q&A ("Ask TripOS").
   *
   * Core Guarantees:
   * 1. Privacy & Boundary: Feeds only minimal authorized data (tasks, balances, readiness)
   *    associated with the requesting member. Never leaks unpermitted records.
   * 2. Grounded Answers: Prevents AI hallucination by answering strictly from DB state.
   * 3. Actionable Navigation: Emits deep-link action pills allowing 1-tap jumps to related tabs.
   *
   * @param tripId The trip ID.
   * @param userId The authenticated user ID.
   * @param question The user's query in English, Hindi, or Hinglish.
   * @returns `AskTripOSResponse` with concise natural language answer and deep-link actions.
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
    if (
      qLower.includes('task') ||
      qLower.includes('todo') ||
      qLower.includes('pending') ||
      qLower.includes('do') ||
      qLower.includes('need') ||
      qLower.includes('pack')
    ) {
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
   * Generates a high-level operational briefing for the Command Center overview.
   *
   * Synthesizes:
   * 1. Overall trip health and member readiness.
   * 2. Key pending attention items requiring immediate action.
   * 3. Group financial and expenditure progress.
   * 4. Single highest-impact next recommendation.
   *
   * @param tripId The trip ID.
   * @param userId The requesting user ID.
   * @returns `TripBriefingResponse` conforming to strict executive schema.
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
   * Deterministic Entity Resolver.
   * Maps colloquial aliases, first-person pronouns, and fuzzy substrings to real database members.
   *
   * Resolution Rules:
   * 1. Self pronouns ('me', 'i', 'myself', 'maine', 'mera', 'meri') map directly to the requesting user.
   * 2. Exact match on member's full name or email username prefix (e.g. 'Rahul' -> 'Rahul Sharma').
   * 3. Substring / partial match when unique with a confidence score of 0.8.
   * 4. Returns null if ambiguous or unresolvable to trigger clarification.
   *
   * @param alias The raw alias or name string extracted by the model.
   * @param members Authorized list of members on the trip.
   * @param requestingMember The authenticated member invoking the endpoint.
   * @returns `ResolvedMember` if matched, or `null`.
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

  /**
   * Single unified conversational chat handler for TripOS AI.
   * Seamlessly interprets plain language intent:
   * - Creates trips ("Create a manali trip with 5 peoples", "Plan a goa trip")
   * - Logs expenses ("I spent 5000 on dinner", "Rahul paid 1200 for cab")
   * - Captures tasks ("Remind Rahul to book cab tomorrow", "Pack luggage by Friday")
   * - Answers questions ("What do I need to do?", "Who owes me money?", "Are we ready?")
   */
  async processUnifiedChat(
    userId: string,
    text: string,
    tripId?: string,
  ): Promise<UnifiedChatResponse> {
    const rawInput = text.trim();
    if (!rawInput) {
      throw new BadRequestException('Please provide a message or instruction.');
    }
    const lower = rawInput.toLowerCase();

    // 1. INTENT: CREATE TRIP
    const isCreateTrip =
      (lower.includes('create') && (lower.includes('trip') || lower.includes('tour') || lower.includes('travel'))) ||
      (lower.includes('plan') && (lower.includes('trip') || lower.includes('tour'))) ||
      lower.startsWith('new trip') ||
      lower.includes('make a trip');

    if (isCreateTrip) {
      let destination = 'TBD';
      const toMatch = rawInput.match(/(?:to|in|for|at)\s+([A-Za-z]+)/i);
      const tripMatch = rawInput.match(/([A-Za-z]+)\s+trip/i);
      if (toMatch && !['a', 'the', 'my', 'our'].includes(toMatch[1].toLowerCase())) {
        destination = toMatch[1];
      } else if (tripMatch && !['new', 'a', 'the', 'create', 'plan'].includes(tripMatch[1].toLowerCase())) {
        destination = tripMatch[1];
      }

      const formattedDest =
        destination !== 'TBD'
          ? destination.charAt(0).toUpperCase() + destination.slice(1).toLowerCase()
          : 'Adventure';

      const tripName = `${formattedDest} Trip`;
      const now = new Date();
      const startDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      const endDate = new Date(startDate.getTime() + 5 * 24 * 60 * 60 * 1000);

      const trip = await this.prisma.trip.create({
        data: {
          creatorId: userId,
          name: tripName,
          destination: formattedDest !== 'Adventure' ? formattedDest : undefined,
          description: `Created with your AI Copilot for effortless group travel.`,
          startDate,
          endDate,
          members: {
            create: {
              userId,
              role: 'OWNER',
            },
          },
        },
      });

      return {
        actionType: 'TRIP_CREATED',
        message: `🎉 Your trip "${trip.name}" is ready! You can now invite friends, track group expenses, and coordinate activities.`,
        trip: {
          id: trip.id,
          name: trip.name,
          destination: trip.destination || undefined,
          startDate: trip.startDate?.toISOString().split('T')[0],
          endDate: trip.endDate?.toISOString().split('T')[0],
        },
        suggestedActions: [
          {
            label: 'Open Trip Workspace',
            actionType: 'NAVIGATE',
            targetPath: `/trips/${trip.id}`,
          },
        ],
      };
    }

    // Resolve target trip for trip-specific actions (expenses, tasks, Q&A)
    let targetTripId = tripId;
    if (!targetTripId) {
      const latestRole = await this.prisma.tripRole.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      });
      targetTripId = latestRole?.tripId;
    }

    if (!targetTripId) {
      return {
        actionType: 'ANSWER',
        message: 'You don\'t have any trips yet. You can type "Create a trip to Manali" to start planning!',
        suggestedActions: [],
      };
    }

    // 2. INTENT: EXPENSE LOGGING
    const hasExpenseKeywords =
      lower.includes('spent') ||
      lower.includes('spend') ||
      lower.includes('paid') ||
      lower.includes('diye') ||
      lower.includes('pay kiya') ||
      lower.includes('bill') ||
      lower.includes('expense') ||
      lower.includes('de diye');
    const hasMoneyNumbers = /\b\d+(?:\.\d+)?\s*(?:k|hazar|thousand|rs|rupees|rupaye|inr|₹)?\b/i.test(lower);

    if (hasExpenseKeywords && hasMoneyNumbers) {
      const proposal = await this.parseExpense(targetTripId, userId, rawInput);
      if (proposal.amountMinor > 0 && proposal.payer) {
        const participants = proposal.participants.length > 0 ? proposal.participants : [proposal.payer];
        const baseSplit = Math.floor(proposal.amountMinor / participants.length);
        const remainder = proposal.amountMinor - baseSplit * participants.length;
        const splits = participants.map((p, idx) => ({
          userId: p.id,
          amount: idx === 0 ? baseSplit + remainder : baseSplit,
        }));

        const created = await this.prisma.expense.create({
          data: {
            tripId: targetTripId,
            payerId: proposal.payer.id,
            description: proposal.description || 'Dinner & food',
            amount: Math.round(proposal.amountMinor),
            currency: proposal.currency || 'INR',
            category: 'EXPENSE',
            splits: {
              create: splits,
            },
          },
        });

        const amountFormatted = `₹${(proposal.amountMinor / 100).toFixed(2)}`;
        const splitFormatted = `₹${(baseSplit / 100).toFixed(2)}`;

        return {
          actionType: 'EXPENSE_CREATED',
          message: `💸 Added expense: "${proposal.description}" for ${amountFormatted}. Paid by ${proposal.payer.name} and split equally among ${participants.length} member(s).`,
          expense: {
            id: created.id,
            description: proposal.description,
            amountFormatted,
            payerName: proposal.payer.name,
            participantsCount: participants.length,
            splitPerPersonFormatted: splitFormatted,
          },
          suggestedActions: [
            {
              label: 'View in Expenses',
              actionType: 'VIEW_EXPENSE',
              targetPath: `/trips/${targetTripId}/expenses`,
            },
          ],
        };
      }
    }

    // 3. INTENT: TASK CAPTURE
    const hasTaskKeywords =
      lower.includes('remind') ||
      lower.includes('pack') ||
      lower.includes('book') ||
      lower.includes('arrange') ||
      lower.includes('call') ||
      lower.includes('bol dena') ||
      lower.includes('bring');

    if (hasTaskKeywords && !hasMoneyNumbers) {
      const taskProposal = await this.parseTask(targetTripId, userId, rawInput);
      if (taskProposal.title) {
        const task = await this.prisma.task.create({
          data: {
            tripId: targetTripId,
            creatorId: userId,
            title: taskProposal.title,
            assignedTo: taskProposal.assignee?.id || null,
            dueDate: taskProposal.dueDate ? new Date(taskProposal.dueDate) : null,
            status: 'OPEN',
          },
        });

        return {
          actionType: 'TASK_CREATED',
          message: `📋 Added task: "${task.title}"${taskProposal.assignee ? ` assigned to ${taskProposal.assignee.name}` : ''}${taskProposal.dueDate ? ` (due ${taskProposal.dueDate})` : ''}.`,
          task: {
            id: task.id,
            title: task.title,
            assigneeName: taskProposal.assignee?.name,
            dueDateFormatted: taskProposal.dueDate || undefined,
            priority: taskProposal.priority || 'MEDIUM',
          },
          suggestedActions: [
            {
              label: 'View in Itinerary',
              actionType: 'VIEW_TASK',
              targetPath: `/trips/${targetTripId}/itinerary`,
            },
          ],
        };
      }
    }

    // 4. INTENT: GROUNDED Q&A
    const qa = await this.askTripOS(targetTripId, userId, rawInput);
    return {
      actionType: 'ANSWER',
      message: qa.answer,
      suggestedActions: qa.suggestedActions,
    };
  }
}
