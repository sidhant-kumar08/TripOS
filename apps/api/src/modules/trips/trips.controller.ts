import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TripsService } from './trips.service';
import { CreateTripDto, InviteMemberDto } from './dtos/trips.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';

@ApiTags('trips')
@Controller('trips')
export class TripsController {
  constructor(private tripsService: TripsService) {}

  @Post()
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new trip' })
  async createTrip(@Req() req: any, @Body() dto: CreateTripDto) {
    return this.tripsService.createTrip(req.user.sub, dto);
  }

  @Get()
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all trips for the current user' })
  async listTrips(@Req() req: any) {
    return this.tripsService.listUserTrips(req.user.sub);
  }

  @Get('invitations/my-pending')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all pending trip invitations for the logged-in user' })
  async getUserPendingInvitations(@Req() req: any) {
    return this.tripsService.getUserPendingInvitations(req.user.sub);
  }

  @Get(':tripId')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific trip' })
  async getTrip(@Req() req: any, @Param('tripId') tripId: string) {
    return this.tripsService.getTripById(tripId, req.user.sub);
  }

  @Delete(':tripId')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a trip and cascade all data (Owner only)' })
  async deleteTrip(@Req() req: any, @Param('tripId') tripId: string) {
    return this.tripsService.deleteTrip(tripId, req.user.sub);
  }

  @Post(':tripId/invite')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invite a member to the trip' })
  async inviteMember(
    @Req() req: any,
    @Param('tripId') tripId: string,
    @Body() dto: InviteMemberDto,
  ) {
    return this.tripsService.inviteMember(tripId, req.user.sub, dto);
  }

  @Get(':tripId/invitations')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all pending invitations sent for a trip (owner/admin only)' })
  async getTripPendingInvitations(
    @Req() req: any,
    @Param('tripId') tripId: string,
  ) {
    return this.tripsService.getTripPendingInvitations(tripId, req.user.sub);
  }

  @Delete(':tripId/invitations/:invitationId')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke/cancel a pending trip invitation' })
  async revokeInvitation(
    @Req() req: any,
    @Param('tripId') tripId: string,
    @Param('invitationId') invitationId: string,
  ) {
    return this.tripsService.revokeInvitation(tripId, invitationId, req.user.sub);
  }

  @Get('invitations/:token')
  @ApiOperation({ summary: 'Get invitation details by token' })
  async getInvitation(@Param('token') token: string) {
    return this.tripsService.getInvitation(token);
  }

  @Post('invitations/accept')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept a trip invitation' })
  async acceptInvitation(@Req() req: any, @Body('token') token: string) {
    return this.tripsService.acceptInvitation(token, req.user.sub);
  }

  @Post('invitations/decline')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Decline a trip invitation' })
  async declineInvitation(@Req() req: any, @Body('token') token: string) {
    return this.tripsService.declineInvitation(token, req.user.sub);
  }
}
