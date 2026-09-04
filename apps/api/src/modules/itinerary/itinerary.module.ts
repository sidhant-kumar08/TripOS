import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/common/database.module';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [ActivitiesService, TasksService],
  controllers: [ActivitiesController, TasksController],
  exports: [ActivitiesService, TasksService],
})
export class ItineraryModule {}
