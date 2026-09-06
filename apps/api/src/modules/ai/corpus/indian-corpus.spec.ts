/**
 * @file indian-corpus.spec.ts
 * @description Comprehensive Indian-language quality, linguistic nuance, and safety test suite for TripOS AI.
 * Validates conversational English, Hindi in Latin script, Hinglish, broken English, colloquial Indian
 * amount notations (5k, 2 hazar, rupaye), relative temporal expressions (kal, parso, 7 bje), and strict
 * zero-trust authorization bounds as mandated by Doc 12.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AIService } from '../ai.service';
import { GeminiProvider } from '../providers/gemini.provider';
import { MockAIProvider } from '../providers/mock.provider';
import { PrismaService } from '@/common/services/prisma.service';

describe('TripOS AI Indian Language Corpus & Safety Suite', () => {
  let aiService: AIService;

  // Authoritative Trip Member Fixture: Simulates a 4-member squad for a Goa group trip.
  const mockTripMembers = [
    {
      userId: 'user-me-123',
      tripId: 'trip-goa-456',
      user: {
        id: 'user-me-123',
        name: 'Sidhant Kumar',
        email: 'sidhant@example.com',
        avatar: null,
      },
    },
    {
      userId: 'user-rahul-789',
      tripId: 'trip-goa-456',
      user: {
        id: 'user-rahul-789',
        name: 'Rahul Sharma',
        email: 'rahul@example.com',
        avatar: null,
      },
    },
    {
      userId: 'user-priya-101',
      tripId: 'trip-goa-456',
      user: {
        id: 'user-priya-101',
        name: 'Priya Patel',
        email: 'priya@example.com',
        avatar: null,
      },
    },
    {
      userId: 'user-ankit-202',
      tripId: 'trip-goa-456',
      user: {
        id: 'user-ankit-202',
        name: 'Ankit Gupta',
        email: 'ankit@example.com',
        avatar: null,
      },
    },
  ];

  const mockPrisma = {
    tripRole: {
      findMany: jest.fn().mockResolvedValue(mockTripMembers),
      findUnique: jest.fn().mockResolvedValue(mockTripMembers[0]),
    },
    trip: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'trip-goa-456',
        name: 'Goa Trip 2026',
        destination: 'Goa',
        startDate: new Date('2026-10-15'),
        endDate: new Date('2026-10-20'),
      }),
    },
    task: {
      findMany: jest.fn().mockResolvedValue([
        { id: 'task-1', title: 'Book airport cab', status: 'OPEN', assignedTo: 'user-me-123', dueDate: new Date() },
        { id: 'task-2', title: 'Hotel confirmation', status: 'COMPLETED', assignedTo: 'user-rahul-789', dueDate: new Date() },
      ]),
    },
    expense: {
      findMany: jest.fn().mockResolvedValue([
        { id: 'exp-1', description: 'Hotel booking', amount: 1500000, currency: 'INR', payerId: 'user-rahul-789' },
      ]),
    },
    expenseBalance: {
      findMany: jest.fn().mockResolvedValue([
        { tripId: 'trip-goa-456', fromUserId: 'user-me-123', toUserId: 'user-rahul-789', balance: 250000 },
      ]),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIService,
        GeminiProvider,
        MockAIProvider,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    aiService = module.get<AIService>(AIService);
  });

  // ============================================================================
  // P0: Natural Language Expense Parser (Indian Language Corpus)
  // ============================================================================
  describe('P0: Natural Language Expense Parser (Indian Language Corpus)', () => {
    /**
     * Pattern: Hindi Ergative Case in Latin Script
     * Linguistic Nuance:
     * - The Hindi postposition "ne" (ने) marks the ergative subject/agent who performed the payment.
     * - "hotel ke" specifies the purpose/description.
     * - "5000 diye" specifies the amount and past-tense verb "gave/paid".
     * System Guarantee:
     * - Resolves "Rahul" to Rahul Sharma (ID: user-rahul-789).
     * - Converts ₹5,000 into 500,000 minor currency units (paise).
     * - Defaults split to all authorized members (EQUAL).
     */
    it('1. should correctly interpret "Rahul ne hotel ke 5000 diye" (Hindi in Latin script)', async () => {
      const result = await aiService.parseExpense('trip-goa-456', 'user-me-123', 'Rahul ne hotel ke 5000 diye');

      // Amount: 5000 INR -> 500000 minor units (paise)
      expect(result.amountMinor).toBe(500000);
      expect(result.currency).toBe('INR');
      expect(result.description).toBe('Hotel');

      // Entity resolution: 'Rahul' matched against 'Rahul Sharma' (user-rahul-789)
      expect(result.payer?.name).toBe('Rahul Sharma');
      expect(result.payer?.id).toBe('user-rahul-789');

      // Default split: all 4 trip members included
      expect(result.participants.length).toBe(4);
      expect(result.needsClarification).toBe(false);
    });

    /**
     * Pattern: English with Colloquial Multiplier
     * Linguistic Nuance:
     * - "5k" is a standard shorthand for 5,000.
     * - "I paid" uses first-person English pronoun.
     * System Guarantee:
     * - Resolves "I" to the active requesting user (Sidhant Kumar, user-me-123).
     * - Resolves "5k" to 500,000 paise.
     */
    it('2. should correctly interpret "I paid 5k for hotel" (English + colloquial amount)', async () => {
      const result = await aiService.parseExpense('trip-goa-456', 'user-me-123', 'I paid 5k for hotel');

      expect(result.amountMinor).toBe(500000);
      expect(result.payer?.id).toBe('user-me-123'); // Self-pronoun resolution
      expect(result.description).toBe('Hotel');
      expect(result.needsClarification).toBe(false);
    });

    /**
     * Pattern: Hinglish Colloquial Expression with Explicit Group Split
     * Linguistic Nuance:
     * - "hotel ka 5k" (object + amount).
     * - "maine diya" (first-person ergative pronoun "I gave/paid").
     * - "sabke liye" (benefactive postposition meaning "for everyone").
     * System Guarantee:
     * - Resolves "maine" to current authenticated user.
     * - "sabke liye" maps split mode to EQUAL across all trip members.
     */
    it('3. should correctly interpret "hotel ka 5k maine diya sabke liye" (Hinglish pronoun & split)', async () => {
      const result = await aiService.parseExpense('trip-goa-456', 'user-me-123', 'hotel ka 5k maine diya sabke liye');

      expect(result.amountMinor).toBe(500000);
      expect(result.payer?.id).toBe('user-me-123');
      expect(result.participants.length).toBe(4);
      expect(result.splitMode).toBe('EQUAL');
    });

    /**
     * Pattern: Exclusion Syntax in Mixed-Language Context
     * Linguistic Nuance:
     * - "Ankit ne dinner ke 2 hazar pay kiye except Rahul"
     * - "2 hazar" is Hindi for 2 thousand (2000 INR).
     * - "except Rahul" explicitly excludes one specific group member from participating in the split.
     * System Guarantee:
     * - Payer resolves to Ankit Gupta (user-ankit-202).
     * - Rahul Sharma (user-rahul-789) is stripped from participant list.
     * - Remaining 3 members (Ankit, Sidhant, Priya) form the valid split group.
     */
    it('4. should correctly interpret "Ankit ne dinner ke 2 hazar pay kiye except Rahul" (Exclusion parsing)', async () => {
      const result = await aiService.parseExpense('trip-goa-456', 'user-me-123', 'Ankit ne dinner ke 2 hazar pay kiye except Rahul');

      expect(result.amountMinor).toBe(200000);
      expect(result.payer?.id).toBe('user-ankit-202');
      expect(result.description).toBe('Dinner');

      // Rahul Sharma should be deterministically excluded from the split participants
      const participantIds = result.participants.map((p) => p.id);
      expect(participantIds).not.toContain('user-rahul-789');
      expect(participantIds).toContain('user-ankit-202');
      expect(participantIds).toContain('user-me-123');
      expect(participantIds).toContain('user-priya-101');
    });

    /**
     * Pattern: Ambiguity & Incomplete Input Safety Invariant
     * Linguistic Nuance:
     * - User writes "I paid for dinner" without specifying how much was paid.
     * System Guarantee:
     * - Never guesses or hallucinates an arbitrary amount.
     * - Flags needsClarification = true with a human-friendly prompt asking for the amount.
     */
    it('5. should flag ambiguity when amount is missing ("paid for dinner")', async () => {
      const result = await aiService.parseExpense('trip-goa-456', 'user-me-123', 'I paid for dinner');

      expect(result.needsClarification).toBe(true);
      expect(result.clarificationMessage).toBeDefined();
    });
  });

  // ============================================================================
  // P0: Natural Language Task Creator
  // ============================================================================
  describe('P0: Natural Language Task Creator', () => {
    /**
     * Pattern: Hindi Conversational Temporal Expression
     * Linguistic Nuance:
     * - "kal" means tomorrow.
     * - "7 bje" means 7:00 (temporal marker).
     * - "airport jana h" denotes departure/transit to airport.
     * System Guarantee:
     * - Maps "kal" to tomorrow's ISO date (YYYY-MM-DD).
     * - Assigns HIGH priority due to upcoming departure proximity.
     */
    it('1. should interpret conversational task "kal 7 bje airport jana h"', async () => {
      const result = await aiService.parseTask('trip-goa-456', 'user-me-123', 'kal 7 bje airport jana h');

      expect(result.title.toLowerCase()).toContain('airport');
      expect(result.dueDate).toBeDefined();
      expect(result.priority).toBe('HIGH');
    });

    /**
     * Pattern: Third-person Hindi Delegation Postposition ("ko bol dena")
     * Linguistic Nuance:
     * - "Priya ko ... bol dena" is standard colloquial Hindi for "Tell Priya to / assign to Priya".
     * - "cab book krne" specifies booking the cab.
     * System Guarantee:
     * - Assignee is resolved to Priya Patel (user-priya-101).
     * - Generates clean actionable title ("Book cab").
     */
    it('2. should assign task to Priya for "Priya ko cab book krne bol dena"', async () => {
      const result = await aiService.parseTask('trip-goa-456', 'user-me-123', 'Priya ko cab book krne bol dena');

      expect(result.title.toLowerCase()).toContain('cab');
      expect(result.assignee?.id).toBe('user-priya-101');
      expect(result.assignee?.name).toBe('Priya Patel');
    });
  });

  // ============================================================================
  // P0: Ask TripOS Grounded Q&A
  // ============================================================================
  describe('P0: Ask TripOS Grounded Q&A', () => {
    /**
     * Pattern: Grounded Operational Question Answering
     * System Guarantee:
     * - Synthesizes answers using authorized trip state (tasks, balances, schedule).
     * - Emits deep-link action suggestions (e.g. actionType: 'VIEW_EXPENSE').
     */
    it('should provide answers grounded in authorized trip state', async () => {
      const result = await aiService.askTripOS('trip-goa-456', 'user-me-123', 'Who owes money or what is my balance?');

      expect(result.answer).toBeDefined();
      expect(result.suggestedActions.length).toBeGreaterThan(0);
      expect(result.suggestedActions.some((a) => a.actionType === 'VIEW_EXPENSE')).toBe(true);
    });
  });

  // ============================================================================
  // P1: Command Center AI Briefing
  // ============================================================================
  describe('P1: Command Center AI Briefing', () => {
    /**
     * Pattern: Executive Operations Summary
     * System Guarantee:
     * - Returns structured executive synthesis (summary, readinessNote, attentionHighlight, financialHighlight, nextAction).
     */
    it('should generate an executive operational summary for Command Center', async () => {
      const result = await aiService.getBriefing('trip-goa-456', 'user-me-123');

      expect(result.summary).toBeDefined();
      expect(result.readinessNote).toBeDefined();
      expect(result.attentionHighlight).toBeDefined();
      expect(result.financialHighlight).toBeDefined();
      expect(result.recommendedNextAction).toBeDefined();
      expect(result.generatedAt).toBeDefined();
    });
  });

  // ============================================================================
  // Safety & Authorization Guards
  // ============================================================================
  describe('Safety & Authorization Guards', () => {
    /**
     * Invariant: Zero-Trust Security Bound
     * System Guarantee:
     * - If a user is not an authorized member of the trip, the request must fail
     *   immediately with a Forbidden exception before any model invocation occurs.
     */
    it('should reject access if user is not a trip member', async () => {
      await expect(
        aiService.parseExpense('trip-goa-456', 'unauthorized-user-999', 'I paid 500 for drinks'),
      ).rejects.toThrow('Access denied');
    });
  });
});
