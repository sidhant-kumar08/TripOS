import {
  Controller,
  Post,
  Get,
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

  @Get(':tripId')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific trip' })
  async getTrip(@Req() req: any, @Param('tripId') tripId: string) {
    return this.tripsService.getTripById(tripId, req.user.sub);
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

  @Post('invitations/accept')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept a trip invitation' })
  async acceptInvitation(@Req() req: any, @Body('token') token: string) {
    return this.tripsService.acceptInvitation(token, req.user.sub);
  }
}
