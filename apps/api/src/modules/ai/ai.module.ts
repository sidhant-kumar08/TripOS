/**
 * @file ai.module.ts
 * @description NestJS Module configuring the AI layer with decoupled providers.
 */

import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/common/database.module';
import { AuthModule } from '../auth/auth.module';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { GeminiProvider } from './providers/gemini.provider';
import { MockAIProvider } from './providers/mock.provider';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [AIController],
  providers: [
    AIService,
    GeminiProvider,
    MockAIProvider,
  ],
  exports: [AIService],
})
export class AIModule {}
