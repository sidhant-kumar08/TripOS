import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto, UpdateActivityDto, UpdateActivityParticipantDto } from './dtos/activity.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';

@ApiTags('activities')
@Controller('trips/:tripId/activities')
export class ActivitiesController {
  constructor(private activitiesService: ActivitiesService) {}

  @Post()
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an activity' })
  async createActivity(
    @Param('tripId') tripId: string,
    @Req() req: any,
    @Body() dto: CreateActivityDto,
  ) {
    return this.activitiesService.createActivity(tripId, req.user.sub, dto);
  }

  @Get()
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all activities in a trip' })
  async listActivities(@Param('tripId') tripId: string, @Req() req: any) {
    return this.activitiesService.listActivities(tripId, req.user.sub);
  }

  @Get(':activityId')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get activity details' })
  async getActivity(
    @Param('tripId') tripId: string,
    @Param('activityId') activityId: string,
    @Req() req: any,
  ) {
    return this.activitiesService.getActivity(tripId, activityId, req.user.sub);
  }

  @Put(':activityId')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an activity' })
  async updateActivity(
    @Param('tripId') tripId: string,
    @Param('activityId') activityId: string,
    @Req() req: any,
    @Body() dto: UpdateActivityDto,
  ) {
    return this.activitiesService.updateActivity(tripId, activityId, req.user.sub, dto);
  }

  @Delete(':activityId')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an activity' })
  async deleteActivity(
    @Param('tripId') tripId: string,
    @Param('activityId') activityId: string,
    @Req() req: any,
  ) {
    return this.activitiesService.deleteActivity(tripId, activityId, req.user.sub);
  }

  @Put(':activityId/participants/status')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update your participation status' })
  async updateParticipantStatus(
    @Param('tripId') tripId: string,
    @Param('activityId') activityId: string,
    @Req() req: any,
    @Body() dto: UpdateActivityParticipantDto,
  ) {
    return this.activitiesService.updateParticipantStatus(
      tripId,
      activityId,
      req.user.sub,
      dto,
    );
  }
}
