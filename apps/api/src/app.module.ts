import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { TripsModule } from './modules/trips/trips.module';
import { UsersModule } from './modules/users/users.module';
import { ItineraryModule } from './modules/itinerary/itinerary.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { VaultModule } from './modules/vault/vault.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    UsersModule,
    TripsModule,
    ItineraryModule,
    ExpensesModule,
    VaultModule,
  ],
})
export class AppModule {}
