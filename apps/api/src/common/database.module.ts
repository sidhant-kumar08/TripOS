import { Global, Module } from '@nestjs/common';
import { PrismaService } from './services/prisma.service';
import { MemoryCacheService } from './services/memory-cache.service';

@Global()
@Module({
  providers: [PrismaService, MemoryCacheService],
  exports: [PrismaService, MemoryCacheService],
})
export class DatabaseModule {}

