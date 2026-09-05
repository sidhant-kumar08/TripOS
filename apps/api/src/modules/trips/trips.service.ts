/**
 * @file trips.service.ts
 * @module @tripos/api/trips
 * @description Trip workspace lifecycle, member invitations, and RBAC authorization.
 */

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

  /**
   * Creates a new trip workspace and assigns the creator as the OWNER.
   * Enforces mandatory, non-past dates (`startDate >= today` and `endDate >= startDate`).
   */
  async createTrip(userId: string, dto: CreateTripDto) {
    if (!dto.startDate || !dto.endDate) {
      throw new BadRequestException('Start date and end date are required');
    }

    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      throw new BadRequestException('Start date cannot be in the past');
    }

    if (start > end) {
      throw new BadRequestException('End date cannot be earlier than start date');
    }

    const trip = await this.prisma.trip.create({
      data: {
        name: dto.name,
        description: dto.description,
        destination: dto.destination,
        startDate: start,
        endDate: end,
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

  /**
   * Retrieves single trip workspace details.
   * @throws {ForbiddenException} If requester is not an active member of this trip.
   */
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

    const isMember = trip.members.some((m: any) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this trip');
    }

    return this.formatTrip(trip);
  }

  /**
   * Lists all trips the user is a member of, sorted by most recently created.
   */
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

  /**
   * Generates a 256-bit cryptographic invitation token valid for 7 days.
   * Only trip OWNER and ADMIN can invite members.
   */
  async inviteMember(tripId: string, userId: string, dto: InviteMemberDto) {
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

    const existingMember = trip.members.find(
      (m: any) => m.user?.email?.toLowerCase() === targetEmail,
    );
    if (existingMember) {
      throw new BadRequestException('User is already a member of this trip');
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

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

  /**
   * Retrieves high-level public preview data for an invitation token without exposing private trip data.
   */
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

  /**
   * Accepts an invitation token, joins the user to the trip with MEMBER role, and marks token used.
   */
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

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if already a member
    const existingRole = await this.prisma.tripRole.findUnique({
      where: {
        tripId_userId: {
          tripId: invitation.tripId,
          userId,
        },
      },
    });

    if (existingRole) {
      await this.prisma.tripInvitation.update({
        where: { id: invitation.id },
        data: { usedAt: new Date() },
      });
      return { success: true, message: 'Already a member of this trip' };
    }

    // Add user as MEMBER and mark invitation used
    await this.prisma.$transaction([
      this.prisma.tripRole.create({
        data: {
          tripId: invitation.tripId,
          userId,
          role: 'MEMBER',
        },
      }),
      this.prisma.tripInvitation.update({
        where: { id: invitation.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { success: true, message: 'Successfully joined trip' };
  }

  /**
   * Declines and marks an invitation token used.
   */
  async declineInvitation(token: string, _userId?: string) {
    const invitation = await this.prisma.tripInvitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.usedAt) {
      throw new BadRequestException('Invitation has already been resolved');
    }

    await this.prisma.tripInvitation.update({
      where: { id: invitation.id },
      data: { usedAt: new Date() },
    });

    return { success: true, message: 'Invitation declined' };
  }

  /**
   * Retrieves pending trip invitations directed to the logged-in user's email address.
   */
  async getUserPendingInvitations(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.email) {
      return [];
    }

    const invitations = await this.prisma.tripInvitation.findMany({
      where: {
        email: user.email.toLowerCase().trim(),
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const result = [];
    for (const inv of invitations) {
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

      if (trip) {
        const isMember = trip.members.some((m) => m.userId === userId);
        if (!isMember) {
          const owner = trip.members.find((m) => m.role === 'OWNER');
          result.push({
            id: inv.id,
            token: inv.token,
            tripId: trip.id,
            tripName: trip.name,
            destination: trip.destination,
            startDate: trip.startDate,
            endDate: trip.endDate,
            membersCount: trip.members.length,
            inviterName:
              owner?.user.name || owner?.user.email || 'Trip Organizer',
            createdAt: inv.createdAt,
            expiresAt: inv.expiresAt,
          });
        }
      }
    }

    return result;
  }

  /**
   * Lists pending invitations sent from a trip (owner/admin view).
   */
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

  /**
   * Revokes a pending invitation token.
   */
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
