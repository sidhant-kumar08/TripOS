import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { AuthModule } from './modules/auth/auth.module';
import { TripsModule } from './modules/trips/trips.module';
import { UsersModule } from './modules/users/users.module';
import { ItineraryModule } from './modules/itinerary/itinerary.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { VaultModule } from './modules/vault/vault.module';
import { CommandCenterModule } from './modules/command-center/command-center.module';
import { AIModule } from './modules/ai/ai.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingModule } from './common/logging/logging.module';
import { DailyFileLogService } from './common/logging/daily-file-log.service';
import { StorageModule } from './common/storage.module';
import { AppController } from './app.controller';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    LoggingModule,
    StorageModule,
    LoggerModule.forRootAsync({
      imports: [LoggingModule],
      inject: [DailyFileLogService],
      useFactory: (dailyFileLogService: DailyFileLogService) => ({
        pinoHttp: [
          {
            level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
            // Omit noisy base fields (pid, hostname)
            base: undefined,
            // Sensitive fields redaction
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'req.headers["set-cookie"]',
                'req.body.password',
                'req.body.confirmPassword',
                'req.body.currentPassword',
                'req.body.newPassword',
                'req.body.token',
                'req.body.refreshToken',
                'req.body.accessToken',
                'req.body.secret',
              ],
              censor: '[REDACTED]',
            },
            // Keep only essential request/response payload details
            serializers: {
              req: (req) => ({
                id: req.id,
                method: req.method,
                url: req.url,
              }),
              res: (res) => ({
                statusCode: res.statusCode,
              }),
              err: (err) => ({
                type: err.type || err.name,
                message: err.message,
                stack: err.stack,
              }),
            },
            // Clean HTTP message summaries
            customSuccessMessage: (req, res, responseTime) => {
              return `${req.method} ${req.url} ${res.statusCode} (+${Math.round(responseTime)}ms)`;
            },
            customErrorMessage: (req, res, err) => {
              return `${req.method} ${req.url} ${res.statusCode} - ${err?.message || 'Request failed'}`;
            },
            // Smart log levels based on HTTP status
            customLogLevel: (_req, res, err) => {
              if (res.statusCode >= 500 || err) return 'error';
              if (res.statusCode >= 400) return 'warn';
              return 'info';
            },
            // Filter out noisy requests from console logs
            autoLogging: {
              ignore: (req) => {
                const url = req.url || '';
                return url === '/favicon.ico' || url === '/api/health' || url.startsWith('/api/docs');
              },
            },
          },
          dailyFileLogService.stream,
        ],
      }),
    }),
    AuthModule,
    UsersModule,
    TripsModule,
    ItineraryModule,
    ExpensesModule,
    VaultModule,
    CommandCenterModule,
    AIModule,
  ],
  providers: [AllExceptionsFilter],
})
export class AppModule {}
