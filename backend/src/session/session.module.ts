import { Module } from '@nestjs/common';
import { ProvidersModule } from '../providers/providers.module';
import { StorageModule } from '../storage/storage.module';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';

@Module({
  imports: [ProvidersModule, StorageModule],
  controllers: [SessionController],
  providers: [SessionService],
  exports: [SessionService]
})
export class SessionModule {}
