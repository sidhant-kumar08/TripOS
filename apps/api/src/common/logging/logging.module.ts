import { Module } from '@nestjs/common';
import { DailyFileLogService } from './daily-file-log.service';

@Module({
  providers: [DailyFileLogService],
  exports: [DailyFileLogService],
})
export class LoggingModule {}