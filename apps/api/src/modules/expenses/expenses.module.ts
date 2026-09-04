import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/common/database.module';
import { ExpensesService } from './expenses.service';
import { ExpensesController } from './expenses.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [ExpensesService],
  controllers: [ExpensesController],
  exports: [ExpensesService],
})
export class ExpensesModule {}
