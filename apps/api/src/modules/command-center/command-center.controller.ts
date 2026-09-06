/**
 * @file command-center.controller.ts
 * @description NestJS Controller exposing the Trip Command Center overview aggregation endpoint.
 */

import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CommandCenterService } from './command-center.service';
import { JwtGuard } from '../auth/guards/jwt.guard';

@ApiTags('command-center')
@Controller('trips/:tripId/overview')
export class CommandCenterController {
  constructor(private readonly commandCenterService: CommandCenterService) {}

  @Get()
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get unified Trip Command Center overview (readiness, attention, waiting, next-up, financial snapshot)',
  })
  async getTripOverview(@Param('tripId') tripId: string, @Req() req: any) {
    return this.commandCenterService.getTripOverview(tripId, req.user.sub);
  }
}
