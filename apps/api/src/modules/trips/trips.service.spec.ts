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
      const dto = {
        name: 'Bali 2024',
        destination: 'Bali',
      };

      const mockTrip = {
        id: 'trip-id',
        name: dto.name,
        destination: dto.destination,
        description: null,
        startDate: null,
        endDate: null,
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
  });
});
