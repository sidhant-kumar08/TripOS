import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/common/database.module';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [TripsService],
  controllers: [TripsController],
  exports: [TripsService],
})
export class TripsModule {}
