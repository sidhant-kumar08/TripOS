import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { DestinationStream } from 'pino';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DailyFileLogService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(DailyFileLogService.name);
  private readonly logDir = path.resolve(process.cwd(), process.env.LOG_DIR || 'logs');
  private readonly retentionDays = Number(process.env.LOG_RETENTION_DAYS || 30);
  private currentDate = '';
  private currentStream: fs.WriteStream | null = null;
  private cleanupTimer: NodeJS.Timeout | null = null;

  readonly stream: DestinationStream = {
    write: (chunk: string | Uint8Array) => {
      const line = Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk);
      this.writeLine(line);
      return true;
    },
  };

  async onModuleInit() {
    fs.mkdirSync(this.logDir, { recursive: true });
    await this.cleanupOldLogs();

    this.cleanupTimer = setInterval(() => {
      void this.cleanupOldLogs();
    }, 24 * 60 * 60 * 1000);

    this.cleanupTimer.unref?.();
  }

  async onApplicationShutdown() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    await this.closeCurrentStream();
  }

  private writeLine(line: string) {
    const fileStream = this.getCurrentStream();
    const output = line.endsWith('\n') ? line : `${line}\n`;
    fileStream.write(output);
    process.stdout.write(output);
  }

  private getCurrentStream() {
    const today = this.getDateStamp(new Date());

    if (!this.currentStream || this.currentDate !== today) {
      this.rotateStream(today);
    }

    return this.currentStream as fs.WriteStream;
  }

  private rotateStream(dateStamp: string) {
    if (this.currentStream) {
      this.currentStream.end();
    }

    this.currentDate = dateStamp;
    const filePath = path.join(this.logDir, `tripos-api-${dateStamp}.log`);
    this.currentStream = fs.createWriteStream(filePath, { flags: 'a' });
    this.currentStream.on('error', (error) => {
      this.logger.error(`Failed writing to log file: ${String(error)}`);
    });
  }

  private async cleanupOldLogs() {
    try {
      const entries = await fs.promises.readdir(this.logDir, { withFileTypes: true });
      const cutoff = Date.now() - this.retentionDays * 24 * 60 * 60 * 1000;

      await Promise.all(
        entries
          .filter((entry) => entry.isFile() && entry.name.startsWith('tripos-api-') && entry.name.endsWith('.log'))
          .map(async (entry) => {
            const filePath = path.join(this.logDir, entry.name);
            const stat = await fs.promises.stat(filePath);
            if (stat.mtime.getTime() < cutoff) {
              await fs.promises.unlink(filePath);
            }
          }),
      );
    } catch (error) {
      this.logger.warn(`Log cleanup skipped: ${String(error)}`);
    }
  }

  private async closeCurrentStream() {
    if (!this.currentStream) {
      return;
    }

    const stream = this.currentStream;
    this.currentStream = null;

    await new Promise<void>((resolve) => {
      stream.end(() => resolve());
    });
  }

  private getDateStamp(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}