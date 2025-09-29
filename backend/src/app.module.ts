import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProvidersModule } from './providers/providers.module';
import { SessionModule } from './session/session.module';
import { StorageModule } from './storage/storage.module';
import { StreamingModule } from './streaming/streaming.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ProvidersModule,
    SessionModule,
    StorageModule,
    StreamingModule
  ]
})
export class AppModule {}
