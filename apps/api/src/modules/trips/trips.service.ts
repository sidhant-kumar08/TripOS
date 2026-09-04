import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/common/services/prisma.service';
import { CreateTripDto, InviteMemberDto } from './dtos/trips.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class TripsService {
  constructor(private prisma: PrismaService) {}

  async createTrip(userId: string, dto: CreateTripDto) {
    // Create trip
    const trip = await this.prisma.trip.create({
      data: {
        name: dto.name,
        description: dto.description,
        destination: dto.destination,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        creatorId: userId,
        members: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    return this.formatTrip(trip);
  }

  async getTripById(tripId: string, userId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    // Check if user is a member
    const isMember = trip.members.some((m: any) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this trip');
    }

    return this.formatTrip(trip);
  }

  async listUserTrips(userId: string) {
    const trips = await this.prisma.trip.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return trips.map((trip: any) => this.formatTrip(trip));
  }

  async inviteMember(tripId: string, userId: string, dto: InviteMemberDto) {
    // Check if user owns/admins the trip
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        members: true,
      },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    const userRole = trip.members.find((m: any) => m.userId === userId);
    if (!userRole || !['OWNER', 'ADMIN'].includes(userRole.role)) {
      throw new ForbiddenException(
        'Only trip owners and admins can invite members',
      );
    }

    // Check if user is already a member
    const existingMember = trip.members.find(
      (m: any) => m.userId === dto.email, // This is simplified - should look up user by email
    );
    if (existingMember) {
      throw new BadRequestException('User is already a member');
    }

    // Generate invitation token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await this.prisma.tripInvitation.create({
      data: {
        tripId,
        email: dto.email,
        token,
        expiresAt,
      },
    });

    return {
      id: invitation.id,
      email: invitation.email,
      token: invitation.token,
      expiresAt: invitation.expiresAt,
    };
  }

  async acceptInvitation(token: string, userId: string) {
    const invitation = await this.prisma.tripInvitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.usedAt) {
      throw new BadRequestException('Invitation has already been used');
    }

    if (new Date() > invitation.expiresAt) {
      throw new BadRequestException('Invitation has expired');
    }

    // Get user email to verify it matches
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.email !== invitation.email) {
      throw new ForbiddenException(
        'Invitation email does not match your account',
      );
    }

    // Add user to trip
    await this.prisma.tripRole.create({
      data: {
        tripId: invitation.tripId,
        userId,
        role: 'MEMBER',
      },
    });

    // Mark invitation as used
    await this.prisma.tripInvitation.update({
      where: { id: invitation.id },
      data: { usedAt: new Date() },
    });

    const trip = await this.getTripById(invitation.tripId, userId);
    return trip;
  }

  private formatTrip(trip: any) {
    return {
      id: trip.id,
      name: trip.name,
      description: trip.description,
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      creatorId: trip.creatorId,
      members: trip.members.map((m: any): any => ({
        userId: m.userId,
        role: m.role,
        user: {
          id: m.user.id,
          email: m.user.email,
          name: m.user.name,
        },
      })),
      createdAt: trip.createdAt,
      updatedAt: trip.updatedAt,
    };
  }
}
