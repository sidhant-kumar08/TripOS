/**
 * @file indian-corpus.spec.ts
 * @description Comprehensive Indian-language quality and safety test suite for TripOS AI.
 * Tests English, Hindi in Latin script, Hinglish, broken English, Indian amounts, and dates.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AIService } from '../ai.service';
import { GeminiProvider } from '../providers/gemini.provider';
import { MockAIProvider } from '../providers/mock.provider';
import { PrismaService } from '@/common/services/prisma.service';

describe('TripOS AI Indian Language Corpus & Safety Suite', () => {
  let aiService: AIService;

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

  describe('P0: Natural Language Expense Parser (Indian Language Corpus)', () => {
    it('1. should correctly interpret "Rahul ne hotel ke 5000 diye" (Hindi in Latin script)', async () => {
      const result = await aiService.parseExpense('trip-goa-456', 'user-me-123', 'Rahul ne hotel ke 5000 diye');

      expect(result.amountMinor).toBe(500000);
      expect(result.currency).toBe('INR');
      expect(result.description).toBe('Hotel');
      expect(result.payer?.name).toBe('Rahul Sharma');
      expect(result.payer?.id).toBe('user-rahul-789');
      expect(result.participants.length).toBe(4);
      expect(result.needsClarification).toBe(false);
    });

    it('2. should correctly interpret "I paid 5k for hotel" (English + colloquial amount)', async () => {
      const result = await aiService.parseExpense('trip-goa-456', 'user-me-123', 'I paid 5k for hotel');

      expect(result.amountMinor).toBe(500000);
      expect(result.payer?.id).toBe('user-me-123'); // Self-resolution
      expect(result.description).toBe('Hotel');
      expect(result.needsClarification).toBe(false);
    });

    it('3. should correctly interpret "hotel ka 5k maine diya sabke liye" (Hinglish pronoun & split)', async () => {
      const result = await aiService.parseExpense('trip-goa-456', 'user-me-123', 'hotel ka 5k maine diya sabke liye');

      expect(result.amountMinor).toBe(500000);
      expect(result.payer?.id).toBe('user-me-123');
      expect(result.participants.length).toBe(4);
      expect(result.splitMode).toBe('EQUAL');
    });

    it('4. should correctly interpret "Ankit ne dinner ke 2 hazar pay kiye except Rahul" (Exclusion parsing)', async () => {
      const result = await aiService.parseExpense('trip-goa-456', 'user-me-123', 'Ankit ne dinner ke 2 hazar pay kiye except Rahul');

      expect(result.amountMinor).toBe(200000);
      expect(result.payer?.id).toBe('user-ankit-202');
      expect(result.description).toBe('Dinner');
      // Rahul Sharma should be excluded from participants
      const participantIds = result.participants.map((p) => p.id);
      expect(participantIds).not.toContain('user-rahul-789');
      expect(participantIds).toContain('user-ankit-202');
      expect(participantIds).toContain('user-me-123');
      expect(participantIds).toContain('user-priya-101');
    });

    it('5. should flag ambiguity when amount is missing ("paid for dinner")', async () => {
      const result = await aiService.parseExpense('trip-goa-456', 'user-me-123', 'I paid for dinner');

      expect(result.needsClarification).toBe(true);
      expect(result.clarificationMessage).toBeDefined();
    });
  });

  describe('P0: Natural Language Task Creator', () => {
    it('1. should interpret conversational task "kal 7 bje airport jana h"', async () => {
      const result = await aiService.parseTask('trip-goa-456', 'user-me-123', 'kal 7 bje airport jana h');

      expect(result.title.toLowerCase()).toContain('airport');
      expect(result.dueDate).toBeDefined();
      expect(result.priority).toBe('HIGH');
    });

    it('2. should assign task to Priya for "Priya ko cab book krne bol dena"', async () => {
      const result = await aiService.parseTask('trip-goa-456', 'user-me-123', 'Priya ko cab book krne bol dena');

      expect(result.title.toLowerCase()).toContain('cab');
      expect(result.assignee?.id).toBe('user-priya-101');
      expect(result.assignee?.name).toBe('Priya Patel');
    });
  });

  describe('P0: Ask TripOS Grounded Q&A', () => {
    it('should provide answers grounded in authorized trip state', async () => {
      const result = await aiService.askTripOS('trip-goa-456', 'user-me-123', 'Who owes money or what is my balance?');

      expect(result.answer).toBeDefined();
      expect(result.suggestedActions.length).toBeGreaterThan(0);
      expect(result.suggestedActions.some((a) => a.actionType === 'VIEW_EXPENSE')).toBe(true);
    });
  });

  describe('P1: Command Center AI Briefing', () => {
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

  describe('Safety & Authorization Guards', () => {
    it('should reject access if user is not a trip member', async () => {
      await expect(
        aiService.parseExpense('trip-goa-456', 'unauthorized-user-999', 'I paid 500 for drinks'),
      ).rejects.toThrow('Access denied');
    });
  });
});
