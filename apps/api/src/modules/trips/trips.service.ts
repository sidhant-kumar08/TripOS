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

    const userRole = trip.members.find((m: any) => m.userId === userId);
    if (!userRole || !['OWNER', 'ADMIN'].includes(userRole.role)) {
      throw new ForbiddenException(
        'Only trip owners and admins can invite members',
      );
    }

    const targetEmail = dto.email.toLowerCase().trim();

    // Check if user is already a member
    const existingMember = trip.members.find(
      (m: any) => m.user?.email?.toLowerCase() === targetEmail,
    );
    if (existingMember) {
      throw new BadRequestException('User is already a member of this trip');
    }

    // Generate invitation token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await this.prisma.tripInvitation.upsert({
      where: {
        tripId_email: {
          tripId,
          email: targetEmail,
        },
      },
      create: {
        tripId,
        email: targetEmail,
        token,
        expiresAt,
      },
      update: {
        token,
        expiresAt,
        usedAt: null,
      },
    });

    return {
      id: invitation.id,
      email: invitation.email,
      token: invitation.token,
      expiresAt: invitation.expiresAt,
    };
  }

  async getInvitation(token: string) {
    const invitation = await this.prisma.tripInvitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    const trip = await this.prisma.trip.findUnique({
      where: { id: invitation.tripId },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!trip) {
      throw new NotFoundException('Associated trip not found');
    }

    return {
      id: invitation.id,
      email: invitation.email,
      tripId: invitation.tripId,
      tripName: trip.name,
      destination: trip.destination,
      description: trip.description,
      startDate: trip.startDate,
      endDate: trip.endDate,
      membersCount: trip.members.length,
      isExpired: new Date() > invitation.expiresAt,
      isUsed: !!invitation.usedAt,
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

    // Get user email to verify it matches (if invitation had specific target email)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (invitation.email && user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new ForbiddenException(
        `This invitation was sent to ${invitation.email}. You are currently logged in as ${user.email}.`,
      );
    }

    // Check if user is already a member
    const existingRole = await this.prisma.tripRole.findUnique({
      where: {
        tripId_userId: {
          tripId: invitation.tripId,
          userId,
        },
      },
    });

    if (!existingRole) {
      // Add user to trip
      await this.prisma.tripRole.create({
        data: {
          tripId: invitation.tripId,
          userId,
          role: 'MEMBER',
        },
      });
    }

    // Mark invitation as used
    await this.prisma.tripInvitation.update({
      where: { id: invitation.id },
      data: { usedAt: new Date() },
    });

    const trip = await this.getTripById(invitation.tripId, userId);
    return trip;
  }

  async declineInvitation(token: string, userId: string) {
    const invitation = await this.prisma.tripInvitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (invitation.email && user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new ForbiddenException(
        `This invitation was sent to ${invitation.email}. You cannot decline it.`,
      );
    }

    await this.prisma.tripInvitation.delete({
      where: { id: invitation.id },
    });

    return { success: true, message: 'Invitation declined' };
  }

  async getUserPendingInvitations(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const invitations = await this.prisma.tripInvitation.findMany({
      where: {
        email: user.email.toLowerCase(),
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const result = await Promise.all(
      invitations.map(async (inv) => {
        const trip = await this.prisma.trip.findUnique({
          where: { id: inv.tripId },
          include: {
            members: {
              include: {
                user: true,
              },
            },
          },
        });

        const owner = trip?.members.find((m) => m.role === 'OWNER');

        return {
          id: inv.id,
          token: inv.token,
          email: inv.email,
          createdAt: inv.createdAt,
          expiresAt: inv.expiresAt,
          tripId: inv.tripId,
          tripName: trip?.name || 'Trip Workspace',
          destination: trip?.destination,
          description: trip?.description,
          startDate: trip?.startDate,
          endDate: trip?.endDate,
          membersCount: trip?.members.length || 1,
          inviterName: owner?.user.name || owner?.user.email || 'Trip Organizer',
        };
      }),
    );

    return result;
  }

  async getTripPendingInvitations(tripId: string, userId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        members: true,
      },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    const userRole = trip.members.find((m) => m.userId === userId);
    if (!userRole || !['OWNER', 'ADMIN'].includes(userRole.role)) {
      throw new ForbiddenException(
        'Only trip owners and admins can view pending invitations',
      );
    }

    const invitations = await this.prisma.tripInvitation.findMany({
      where: {
        tripId,
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return invitations.map((inv) => ({
      id: inv.id,
      email: inv.email,
      token: inv.token,
      createdAt: inv.createdAt,
      expiresAt: inv.expiresAt,
    }));
  }

  async revokeInvitation(tripId: string, invitationId: string, userId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        members: true,
      },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    const userRole = trip.members.find((m) => m.userId === userId);
    if (!userRole || !['OWNER', 'ADMIN'].includes(userRole.role)) {
      throw new ForbiddenException(
        'Only trip owners and admins can revoke invitations',
      );
    }

    await this.prisma.tripInvitation.deleteMany({
      where: {
        id: invitationId,
        tripId,
      },
    });

    return { success: true, message: 'Invitation revoked' };
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
