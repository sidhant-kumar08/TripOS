/**
 * @file ai.controller.ts
 * @description NestJS Controller exposing authenticated TripOS AI endpoints.
 */

import { Controller, Post, Get, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { AIService } from './ai.service';

export class ParseTextDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  text!: string;
}

export class AskQuestionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  question!: string;
}

@ApiTags('ai')
@Controller('trips/:tripId/ai')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('parse-expense')
  @ApiOperation({ summary: 'Parse natural language conversational expense text into an actionable proposal' })
  async parseExpense(
    @Param('tripId') tripId: string,
    @Body() dto: ParseTextDto,
    @Req() req: any,
  ) {
    return this.aiService.parseExpense(tripId, req.user.sub, dto.text);
  }

  @Post('parse-task')
  @ApiOperation({ summary: 'Parse natural language conversational task text into an actionable proposal' })
  async parseTask(
    @Param('tripId') tripId: string,
    @Body() dto: ParseTextDto,
    @Req() req: any,
  ) {
    return this.aiService.parseTask(tripId, req.user.sub, dto.text);
  }

  @Post('ask')
  @ApiOperation({ summary: 'Ask TripOS contextual questions grounded strictly in authorized trip state' })
  async askTripOS(
    @Param('tripId') tripId: string,
    @Body() dto: AskQuestionDto,
    @Req() req: any,
  ) {
    return this.aiService.askTripOS(tripId, req.user.sub, dto.question);
  }

  @Get('briefing')
  @ApiOperation({ summary: 'Get executive AI operational briefing for Command Center overview' })
  async getBriefing(
    @Param('tripId') tripId: string,
    @Req() req: any,
  ) {
    return this.aiService.getBriefing(tripId, req.user.sub);
  }
}
