import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { DestinationStream } from 'pino';
import * as fs from 'fs';
import * as path from 'path';

// ANSI color codes for terminal formatting
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const MAGENTA = '\x1b[35m';
const CYAN = '\x1b[36m';
const GRAY = '\x1b[90m';

interface ParsedLog {
  time?: number | string;
  level?: number | string;
  context?: string;
  msg?: string;
  message?: string;
  req?: { id?: string; method?: string; url?: string; query?: unknown };
  res?: { statusCode?: number };
  responseTime?: number;
  err?: { type?: string; message?: string; stack?: string };
  stack?: string;
  [key: string]: unknown;
}

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
      const raw = Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk);
      const lines = raw.split(/\r?\n/);
      for (const line of lines) {
        if (line.trim().length > 0) {
          this.processLogLine(line.trim());
        }
      }
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

  private processLogLine(rawJson: string) {
    try {
      const log = JSON.parse(rawJson) as ParsedLog;

      // 1. Write clean formatted output to console
      const consoleOutput = this.formatConsoleOutput(log);
      process.stdout.write(consoleOutput + '\n');

      // 2. Write clean normalized JSON to rotating file
      const fileOutput = this.formatFileOutput(log);
      const fileStream = this.getCurrentStream();
      fileStream.write(fileOutput + '\n');
    } catch {
      // Fallback for non-JSON lines
      process.stdout.write(rawJson + '\n');
      const fileStream = this.getCurrentStream();
      fileStream.write(rawJson + '\n');
    }
  }

  private formatConsoleOutput(log: ParsedLog): string {
    const timeStr = this.formatTime(log.time);
    const { label: levelLabel, color: levelColor } = this.resolveLevel(log.level);
    const context = log.context ? `${CYAN}[${log.context}]${RESET} ` : '';

    let message = log.msg || log.message || '';

    // If HTTP log with response time, format nicely
    if (log.req && log.res) {
      const method = log.req.method || 'HTTP';
      const url = log.req.url || '';
      const status = log.res.statusCode || 200;
      const statusColor = status >= 500 ? RED : status >= 400 ? YELLOW : GREEN;
      const timeTaken = typeof log.responseTime === 'number' ? ` ${DIM}+${Math.round(log.responseTime)}ms${RESET}` : '';
      message = `${BOLD}${method}${RESET} ${url} ${statusColor}${status}${RESET}${timeTaken}`;
    }

    let result = `${GRAY}${timeStr}${RESET} ${levelColor}${levelLabel}${RESET} ${context}${message}`;

    // Append error stack if present
    if (log.err?.stack || log.stack) {
      const stack = log.err?.stack || log.stack;
      result += `\n${RED}${stack}${RESET}`;
    }

    return result;
  }

  private formatFileOutput(log: ParsedLog): string {
    const { label: levelLabel } = this.resolveLevel(log.level);
    const timestamp = log.time
      ? (typeof log.time === 'number' ? new Date(log.time).toISOString() : String(log.time))
      : new Date().toISOString();

    const cleanLog: Record<string, unknown> = {
      timestamp,
      level: levelLabel.trim(),
    };

    if (log.context) cleanLog.context = log.context;
    if (log.msg || log.message) cleanLog.message = log.msg || log.message;
    if (log.req) {
      cleanLog.req = {
        id: log.req.id,
        method: log.req.method,
        url: log.req.url,
      };
    }
    if (log.res) cleanLog.res = { statusCode: log.res.statusCode };
    if (typeof log.responseTime === 'number') cleanLog.responseTimeMs = Math.round(log.responseTime);
    if (log.err) {
      cleanLog.error = {
        type: log.err.type,
        message: log.err.message,
        stack: log.err.stack,
      };
    }

    return JSON.stringify(cleanLog);
  }

  private resolveLevel(level: number | string | undefined): { label: string; color: string } {
    const num = typeof level === 'number' ? level : Number(level);
    if (num >= 50 || level === 'error' || level === 'fatal') {
      return { label: 'ERROR', color: RED };
    }
    if (num >= 40 || level === 'warn') {
      return { label: 'WARN ', color: YELLOW };
    }
    if (num >= 30 || level === 'info') {
      return { label: 'INFO ', color: GREEN };
    }
    if (num >= 20 || level === 'debug') {
      return { label: 'DEBUG', color: MAGENTA };
    }
    return { label: 'TRACE', color: GRAY };
  }

  private formatTime(time: number | string | undefined): string {
    const date = time ? new Date(time) : new Date();
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    const ms = String(date.getMilliseconds()).padStart(3, '0');
    return `${h}:${m}:${s}.${ms}`;
  }

  private getCurrentStream(): fs.WriteStream {
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