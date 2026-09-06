/**
 * @file command-center.module.ts
 * @description NestJS Module configuring the Command Center service and controller.
 */

import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/common/database.module';
import { AuthModule } from '../auth/auth.module';
import { CommandCenterController } from './command-center.controller';
import { CommandCenterService } from './command-center.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [CommandCenterController],
  providers: [CommandCenterService],
  exports: [CommandCenterService],
})
export class CommandCenterModule {}

