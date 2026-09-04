import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/common/database.module';
import { VaultService } from './vault.service';
import { VaultController } from './vault.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [VaultService],
  controllers: [VaultController],
  exports: [VaultService],
})
export class VaultModule {}
