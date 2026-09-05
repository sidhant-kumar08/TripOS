import { Test, TestingModule } from '@nestjs/testing';
import { TripsService } from './trips.service';
import { PrismaService } from '@/common/services/prisma.service';

describe('TripsService', () => {
  let service: TripsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripsService,
        {
          provide: PrismaService,
          useValue: {
            trip: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
            },
            tripRole: {
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<TripsService>(TripsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTrip', () => {
    it('should create a new trip with the creator as owner', async () => {
      const userId = 'user-id';
      const futureStart = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const futureEnd = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

      const dto = {
        name: 'Bali 2026',
        destination: 'Bali',
        startDate: futureStart,
        endDate: futureEnd,
      };

      const mockTrip = {
        id: 'trip-id',
        name: dto.name,
        destination: dto.destination,
        description: null,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        creatorId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        members: [
          {
            userId,
            role: 'OWNER',
            user: { id: userId, email: 'test@example.com', name: 'Test User' },
          },
        ],
      };

      jest.spyOn(prisma.trip, 'create').mockResolvedValue(mockTrip as any);

      const result = await service.createTrip(userId, dto);
      expect(result.name).toBe(dto.name);
      expect(result.members[0].role).toBe('OWNER');
    });

    it('should throw BadRequestException if dates are missing or in the past', async () => {
      const userId = 'user-id';
      await expect(
        service.createTrip(userId, {
          name: 'Past Trip',
          startDate: '2020-01-01',
          endDate: '2020-01-05',
        }),
      ).rejects.toThrow('Start date cannot be in the past');
    });
  });
});
