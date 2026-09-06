/**
 * @file ai.controller.ts
 * @description NestJS Controller exposing authenticated TripOS AI endpoints.
 */

import { Controller, Post, Get, Param, Body, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, IsOptional } from 'class-validator';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { AIService } from './ai.service';

/**
 * Data transfer object carrying conversational natural-language input for expense or task parsing.
 */
export class ParseTextDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  text!: string;
}

/**
 * Data transfer object carrying a contextual user inquiry for "Ask TripOS".
 */
export class AskQuestionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  question!: string;
}

/**
 * AIController exposes trip-scoped, authenticated endpoints for natural language
 * interpretation, contextual question-answering, and executive operational briefings.
 *
 * Invariant: AI never mutates domain records directly; mutations occur only via user
 * confirmation on the existing domain services.
 */
@ApiTags('ai')
@Controller('trips/:tripId/ai')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class AIController {
  constructor(private readonly aiService: AIService) {}

  /**
   * Parses conversational expense input (English, Hindi, Hinglish) into an actionable proposal.
   */
  @Post('parse-expense')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Parse conversational expense text into an actionable proposal',
    description: 'Interprets colloquial amounts (5k, 2 hazar), payers (Rahul ne, maine), and exclusions (except Rahul), resolving against real trip members.',
  })
  @ApiParam({ name: 'tripId', description: 'The unique CUID of the active trip' })
  @ApiResponse({ status: 200, description: 'Expense proposal successfully generated' })
  @ApiResponse({ status: 403, description: 'Forbidden: User is not an authorized member of this trip' })
  async parseExpense(
    @Param('tripId') tripId: string,
    @Body() dto: ParseTextDto,
    @Req() req: any,
  ) {
    return this.aiService.parseExpense(tripId, req.user.sub, dto.text);
  }

  /**
   * Parses conversational task descriptions with dates and assignments into an actionable proposal.
   */
  @Post('parse-task')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Parse conversational task text into an actionable proposal',
    description: 'Extracts title, assignee (Priya ko bol dena), conversational dates (kal 7 bje), and priority urgency.',
  })
  @ApiParam({ name: 'tripId', description: 'The unique CUID of the active trip' })
  @ApiResponse({ status: 200, description: 'Task proposal successfully generated' })
  async parseTask(
    @Param('tripId') tripId: string,
    @Body() dto: ParseTextDto,
    @Req() req: any,
  ) {
    return this.aiService.parseTask(tripId, req.user.sub, dto.text);
  }

  /**
   * Answers user inquiries strictly grounded in authorized trip records.
   */
  @Post('ask')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ask TripOS contextual questions grounded in authorized trip state',
    description: 'Answers questions about pending tasks, balances, and readiness without leaking unauthorized data.',
  })
  @ApiParam({ name: 'tripId', description: 'The unique CUID of the active trip' })
  @ApiResponse({ status: 200, description: 'Grounded response with actionable navigation pills' })
  async askTripOS(
    @Param('tripId') tripId: string,
    @Body() dto: AskQuestionDto,
    @Req() req: any,
  ) {
    return this.aiService.askTripOS(tripId, req.user.sub, dto.question);
  }

  /**
   * Returns an executive operational synthesis for the Command Center overview.
   */
  @Get('briefing')
  @ApiOperation({
    summary: 'Get executive AI operational briefing for Command Center overview',
    description: 'Synthesizes trip readiness, pending attention items, and financial highlights into a calm operational summary.',
  })
  @ApiParam({ name: 'tripId', description: 'The unique CUID of the active trip' })
  @ApiResponse({ status: 200, description: 'Executive operational briefing generated' })
  async getBriefing(
    @Param('tripId') tripId: string,
    @Req() req: any,
  ) {
    return this.aiService.getBriefing(tripId, req.user.sub);
  }

  /**
   * Single unified conversational chat endpoint for trip-scoped AI interactions.
   */
  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unified conversational AI assistant for trip actions' })
  async tripChat(
    @Param('tripId') tripId: string,
    @Body() dto: ParseTextDto,
    @Req() req: any,
  ) {
    return this.aiService.processUnifiedChat(req.user.sub, dto.text, tripId);
  }
}

export class GlobalChatDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  text!: string;

  @IsString()
  @IsOptional()
  tripId?: string;
}

@ApiTags('ai')
@Controller('ai')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class GlobalAIController {
  constructor(private readonly aiService: AIService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unified conversational AI copilot entry point' })
  async chat(@Body() dto: GlobalChatDto, @Req() req: any) {
    return this.aiService.processUnifiedChat(req.user.sub, dto.text, dto.tripId);
  }
}

