/**
 * @file command-center.module.ts
 * @description NestJS Module configuring the Command Center service and controller.
 */

import { Module } from '@nestjs/common';
import { CommandCenterController } from './command-center.controller';
import { CommandCenterService } from './command-center.service';
import { PrismaService } from '@/common/services/prisma.service';

@Module({
  controllers: [CommandCenterController],
  providers: [CommandCenterService, PrismaService],
  exports: [CommandCenterService],
})
export class CommandCenterModule {}
