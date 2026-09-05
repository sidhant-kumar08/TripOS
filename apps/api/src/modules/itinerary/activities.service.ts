import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/common/services/prisma.service';
import { CreateActivityDto, UpdateActivityDto, UpdateActivityParticipantDto } from './dtos/activity.dto';

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService) {}

  async createActivity(tripId: string, userId: string, dto: CreateActivityDto) {
    // Verify user is at least a regular member (not GUEST)
    await this.verifyTripRole(tripId, userId, ['OWNER', 'ADMIN', 'MEMBER']);

    // Validate time
    const startTime = new Date(dto.startTime);
    const endTime = dto.endTime ? new Date(dto.endTime) : null;

    if (endTime && startTime >= endTime) {
      throw new BadRequestException('End time must be after start time');
    }

    const activity = await this.prisma.activity.create({
      data: {
        tripId,
        title: dto.title,
        description: dto.description,
        location: dto.location,
        startTime,
        endTime,
        participants: {
          create: dto.participantIds?.map((participantId) => ({
            tripId,
            userId: participantId,
            status: 'ATTENDING',
          })) || [],
        },
      },
      include: {
        participants: {
          include: {
            // Note: ActivityParticipant doesn't include user, adjust as needed
          },
        },
      },
    });

    return this.formatActivity(activity);
  }

  async getActivity(tripId: string, activityId: string, userId: string) {
    await this.verifyTripMembership(tripId, userId);

    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        participants: true,
      },
    });

    if (!activity || activity.tripId !== tripId) {
      throw new NotFoundException('Activity not found');
    }

    return this.formatActivity(activity);
  }

  async listActivities(tripId: string, userId: string) {
    await this.verifyTripMembership(tripId, userId);

    const activities = await this.prisma.activity.findMany({
      where: { tripId },
      include: {
        participants: true,
      },
      orderBy: { startTime: 'asc' },
    });

    return activities.map((a: any) => this.formatActivity(a));
  }

  async updateActivity(
    tripId: string,
    activityId: string,
    userId: string,
    dto: UpdateActivityDto,
  ) {
    // Only trip OWNER and ADMIN can modify itinerary activities
    await this.verifyTripRole(tripId, userId, ['OWNER', 'ADMIN']);

    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
    });

    if (!activity || activity.tripId !== tripId) {
      throw new NotFoundException('Activity not found');
    }

    // Validate times if provided
    const startTime = dto.startTime ? new Date(dto.startTime) : activity.startTime;
    const endTime = dto.endTime ? new Date(dto.endTime) : activity.endTime;

    if (endTime && startTime >= endTime) {
      throw new BadRequestException('End time must be after start time');
    }

    const updated = await this.prisma.activity.update({
      where: { id: activityId },
      data: {
        title: dto.title,
        description: dto.description,
        location: dto.location,
        startTime,
        endTime,
      },
      include: {
        participants: true,
      },
    });

    return this.formatActivity(updated);
  }

  async deleteActivity(tripId: string, activityId: string, userId: string) {
    // Only trip OWNER and ADMIN can delete itinerary activities
    await this.verifyTripRole(tripId, userId, ['OWNER', 'ADMIN']);

    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
    });

    if (!activity || activity.tripId !== tripId) {
      throw new NotFoundException('Activity not found');
    }

    await this.prisma.activity.delete({
      where: { id: activityId },
    });

    return { success: true };
  }

  async updateParticipantStatus(
    tripId: string,
    activityId: string,
    userId: string,
    dto: UpdateActivityParticipantDto,
  ) {
    await this.verifyTripMembership(tripId, userId);

    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
    });

    if (!activity || activity.tripId !== tripId) {
      throw new NotFoundException('Activity not found');
    }

    const participant = await this.prisma.activityParticipant.findUnique({
      where: {
        activityId_userId: {
          activityId,
          userId,
        },
      },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    const updated = await this.prisma.activityParticipant.update({
      where: {
        activityId_userId: {
          activityId,
          userId,
        },
      },
      data: {
        status: dto.status as any,
      },
    });

    return updated;
  }

  private async verifyTripMembership(tripId: string, userId: string) {
    const membership = await this.prisma.tripRole.findUnique({
      where: {
        tripId_userId: {
          tripId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this trip');
    }

    return membership;
  }

  private async verifyTripRole(
    tripId: string,
    userId: string,
    allowedRoles: string[] = ['OWNER', 'ADMIN'],
  ) {
    const membership = await this.verifyTripMembership(tripId, userId);

    if (!allowedRoles.includes(membership.role)) {
      throw new ForbiddenException(
        'Only trip owners and admins can perform this action',
      );
    }

    return membership;
  }

  private formatActivity(activity: any) {
    return {
      id: activity.id,
      tripId: activity.tripId,
      title: activity.title,
      description: activity.description,
      location: activity.location,
      startTime: activity.startTime,
      endTime: activity.endTime,
      participants: activity.participants || [],
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt,
    };
  }
}
