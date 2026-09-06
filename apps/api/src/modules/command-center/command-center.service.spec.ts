/**
 * @file command-center.service.spec.ts
 * @description Unit tests for CommandCenterService verifying readiness, attention, and waiting state rules.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CommandCenterService } from './command-center.service';
import { PrismaService } from '@/common/services/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('CommandCenterService', () => {
  let service: CommandCenterService;

  const mockPrismaService = {
    tripRole: {
      findUnique: jest.fn(),
    },
    trip: {
      findUnique: jest.fn(),
    },
    task: {
      findMany: jest.fn(),
    },
    activity: {
      findMany: jest.fn(),
    },
    expense: {
      findMany: jest.fn(),
    },
    tripVault: {
      findUnique: jest.fn(),
    },
    tripInvitation: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommandCenterService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CommandCenterService>(CommandCenterService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw ForbiddenException if user is not a member of the trip', async () => {
    mockPrismaService.tripRole.findUnique.mockResolvedValue(null);

    await expect(service.getTripOverview('trip-1', 'user-unauth')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should throw NotFoundException if trip is not found', async () => {
    mockPrismaService.tripRole.findUnique.mockResolvedValue({
      tripId: 'trip-1',
      userId: 'user-1',
      role: 'MEMBER',
    });
    mockPrismaService.trip.findUnique.mockResolvedValue(null);
    mockPrismaService.task.findMany.mockResolvedValue([]);
    mockPrismaService.activity.findMany.mockResolvedValue([]);
    mockPrismaService.expense.findMany.mockResolvedValue([]);
    mockPrismaService.tripVault.findUnique.mockResolvedValue(null);
    mockPrismaService.tripInvitation.findMany.mockResolvedValue([]);

    await expect(service.getTripOverview('trip-1', 'user-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should compute readiness, attention, waiting items, and financial snapshot accurately', async () => {
    const userId = 'user-1';
    const otherUserId = 'user-2';

    mockPrismaService.tripRole.findUnique.mockResolvedValue({
      tripId: 'trip-1',
      userId,
      role: 'OWNER',
    });

    mockPrismaService.trip.findUnique.mockResolvedValue({
      id: 'trip-1',
      name: 'Goa Summer Sprint',
      destination: 'Goa, India',
      startDate: new Date('2026-10-15T00:00:00Z'),
      endDate: new Date('2026-10-20T00:00:00Z'),
      creatorId: userId,
      members: [
        {
          userId,
          role: 'OWNER',
          user: { id: userId, name: 'Alice', email: 'alice@example.com', avatar: null },
        },
        {
          userId: otherUserId,
          role: 'MEMBER',
          user: { id: otherUserId, name: 'Bob', email: 'bob@example.com', avatar: null },
        },
      ],
    });

    const overdueDate = new Date(Date.now() - 2 * 24 * 3600 * 1000);
    const futureDate = new Date(Date.now() + 5 * 24 * 3600 * 1000);

    mockPrismaService.task.findMany.mockResolvedValue([
      {
        id: 'task-1',
        title: 'Book Airbnb Villa in Anjuna',
        assignedTo: userId,
        status: 'OPEN',
        dueDate: overdueDate,
      },
      {
        id: 'task-2',
        title: 'Arrange airport pickup cab',
        assignedTo: otherUserId,
        status: 'OPEN',
        dueDate: futureDate,
      },
      {
        id: 'task-3',
        title: 'Pack sunscreen',
        assignedTo: userId,
        status: 'COMPLETED',
        dueDate: null,
      },
    ]);

    mockPrismaService.activity.findMany.mockResolvedValue([
      {
        id: 'act-1',
        title: 'Check-in to Airbnb Villa',
        startTime: new Date('2026-10-15T14:00:00Z'),
        location: 'Anjuna Beach',
      },
    ]);

    mockPrismaService.expense.findMany.mockResolvedValue([
      {
        id: 'exp-1',
        description: 'Flight bookings',
        amount: 20000, // 200.00
        currency: 'INR',
        payerId: otherUserId,
        splits: [
          { userId: otherUserId, amount: 10000 },
          { userId, amount: 10000 },
        ],
      },
    ]);

    mockPrismaService.tripVault.findUnique.mockResolvedValue({
      id: 'vault-1',
      tripId: 'trip-1',
      files: [
        { id: 'f-1', name: 'villa_reservation.pdf', size: 1024, mimeType: 'application/pdf' },
      ],
    });

    mockPrismaService.tripInvitation.findMany.mockResolvedValue([
      { id: 'inv-1', email: 'charlie@example.com', token: 'tok-1' },
    ]);

    const result = await service.getTripOverview('trip-1', userId);

    // Verify top-level structure
    expect(result.trip.name).toBe('Goa Summer Sprint');
    expect(result.trip.members.length).toBe(2);

    // Verify readiness
    expect(result.readiness.score).toBeGreaterThan(50);
    expect(result.readiness.checks.length).toBe(6);

    // Verify My Attention
    // User-1 has task-1 (overdue) and owes 10000 INR
    expect(result.myAttention.length).toBeGreaterThanOrEqual(1);
    const overdueTaskAttention = result.myAttention.find((a) => a.sourceId === 'task-1');
    expect(overdueTaskAttention).toBeDefined();
    expect(overdueTaskAttention?.urgency).toBe('HIGH');

    // Verify Waiting on Others
    // Task-2 is assigned to Bob, inv-1 is pending for Charlie
    expect(result.waitingOnOthers.length).toBe(2);
    expect(result.waitingOnOthers.some((w) => w.assigneeName === 'Bob')).toBe(true);
    expect(result.waitingOnOthers.some((w) => w.assigneeName === 'charlie@example.com')).toBe(true);

    // Verify Financial Snapshot
    expect(result.financialSnapshot.totalSpend).toBe(20000);
    expect(result.financialSnapshot.myNetBalance).toBe(-10000); // User owes 100.00
    expect(result.financialSnapshot.myObligationSummary).toContain('You owe');

    // Verify Progress
    expect(result.progress.tasksCompleted).toBe(1);
    expect(result.progress.tasksTotal).toBe(3);
  });
});
