import { Test, TestingModule } from '@nestjs/testing';
import { ExpensesService } from './expenses.service';
import { PrismaService } from '@/common/services/prisma.service';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

describe('ExpensesService', () => {
  let service: ExpensesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpensesService,
        {
          provide: PrismaService,
          useValue: {
            tripRole: {
              findUnique: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
            },
            expense: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            expenseSplit: {
              deleteMany: jest.fn(),
              createMany: jest.fn(),
            },
            expenseBalance: {
              findMany: jest.fn(),
              deleteMany: jest.fn(),
              createMany: jest.fn(),
            },
            expenseAuditLog: {
              create: jest.fn(),
              findMany: jest.fn(),
            },
            $transaction: jest.fn((cb) => cb({
              expenseSplit: {
                deleteMany: jest.fn(),
                createMany: jest.fn(),
              },
              expense: {
                update: jest.fn(),
              },
            })),
          },
        },
      ],
    }).compile();

    service = module.get<ExpensesService>(ExpensesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createExpense', () => {
    it('should throw BadRequestException if split amounts do not equal total amount', async () => {
      jest.spyOn(prisma.tripRole, 'findUnique').mockResolvedValue({
        tripId: 'trip-1',
        userId: 'user-1',
        role: 'MEMBER',
      } as any);

      await expect(
        service.createExpense('trip-1', 'user-1', {
          description: 'Dinner',
          amount: 5000, // 50.00
          currency: 'USD',
          splits: [
            { userId: 'user-1', amount: 2000 },
            { userId: 'user-2', amount: 2000 }, // sum = 4000 !== 5000
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if user has GUEST role', async () => {
      jest.spyOn(prisma.tripRole, 'findUnique').mockResolvedValue({
        tripId: 'trip-1',
        userId: 'guest-1',
        role: 'GUEST',
      } as any);

      await expect(
        service.createExpense('trip-1', 'guest-1', {
          description: 'Snacks',
          amount: 1000,
          currency: 'USD',
          splits: [{ userId: 'guest-1', amount: 1000 }],
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getSettlementSuggestions (Greedy Graph Optimizer)', () => {
    it('should simplify pairwise balances to minimum transactions', async () => {
      jest.spyOn(prisma.tripRole, 'findUnique').mockResolvedValue({
        tripId: 'trip-1',
        userId: 'user-1',
        role: 'MEMBER',
      } as any);

      // User 2 owes User 1 $30 (3000), User 3 owes User 1 $20 (2000)
      jest.spyOn(prisma.expenseBalance, 'findMany').mockResolvedValue([
        { tripId: 'trip-1', fromUserId: 'user-2', toUserId: 'user-1', balance: 3000 },
        { tripId: 'trip-1', fromUserId: 'user-3', toUserId: 'user-1', balance: 2000 },
      ] as any);

      jest.spyOn(prisma.user, 'findMany').mockResolvedValue([
        { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
        { id: 'user-2', name: 'Bob', email: 'bob@example.com' },
        { id: 'user-3', name: 'Charlie', email: 'charlie@example.com' },
      ] as any);

      const suggestions = await service.getSettlementSuggestions('trip-1', 'user-1');

      expect(suggestions.length).toBe(2);
      expect(suggestions[0].from).toBe('user-2'); // Bob owes 3000
      expect(suggestions[0].to).toBe('user-1');
      expect(suggestions[0].amount).toBe(3000);
      expect(suggestions[1].from).toBe('user-3'); // Charlie owes 2000
      expect(suggestions[1].to).toBe('user-1');
      expect(suggestions[1].amount).toBe(2000);
    });
  });
});
