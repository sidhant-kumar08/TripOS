import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private readonly activeTarget: string;

  constructor(configService: ConfigService) {
    const target = (
      configService.get<string>('DB_TARGET') ||
      process.env.DB_TARGET ||
      'supabase'
    ).toLowerCase();

    const isLocal = target === 'local';

    const dbUrl =
      configService.get<string>('DATABASE_URL') ||
      process.env.DATABASE_URL ||
      (isLocal
        ? configService.get<string>('LOCAL_DATABASE_URL') || process.env.LOCAL_DATABASE_URL
        : configService.get<string>('SUPABASE_DATABASE_URL') || process.env.SUPABASE_DATABASE_URL);

    super({
      datasources: dbUrl
        ? {
            db: {
              url: dbUrl,
            },
          }
        : undefined,
    });

    this.activeTarget = isLocal ? 'POSTGRES' : 'CLOUD DATABASE';
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log(`Connected to database [${this.activeTarget}] successfully`, 'PrismaService');
    } catch (err: any) {
      this.logger.error(`Database connection warning: ${err?.message || err}`, 'PrismaService');
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log(`Disconnected from database [${this.activeTarget}]`, 'PrismaService');
  }
}
