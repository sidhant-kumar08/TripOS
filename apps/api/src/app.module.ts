import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { AuthModule } from './modules/auth/auth.module';
import { TripsModule } from './modules/trips/trips.module';
import { UsersModule } from './modules/users/users.module';
import { ItineraryModule } from './modules/itinerary/itinerary.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { VaultModule } from './modules/vault/vault.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingModule } from './common/logging/logging.module';
import { DailyFileLogService } from './common/logging/daily-file-log.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    LoggingModule,
    LoggerModule.forRootAsync({
      imports: [LoggingModule],
      inject: [DailyFileLogService],
      useFactory: (dailyFileLogService: DailyFileLogService) => ({
        pinoHttp: [
          {
            level: process.env.LOG_LEVEL || 'info',
            redact: ['req.headers.authorization', 'req.headers.cookie'],
            autoLogging: true,
            customProps: () => ({ service: 'tripos-api' }),
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
  ],
  providers: [AllExceptionsFilter],
})
export class AppModule {}
