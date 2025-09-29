import { Module } from '@nestjs/common';
import { StreamingModule } from '../streaming/streaming.module';
import { StorageModule } from '../storage/storage.module';
import { MockProvider } from './adapters/mock.provider';
import { MODEL_PROVIDERS } from './providers.constants';
import { ProvidersService } from './providers.service';

const defaultProviders = [
  new MockProvider('mock-gpt', 'Mock GPT 4'),
  new MockProvider('mock-claude', 'Mock Claude 3')
];

@Module({
  imports: [StreamingModule, StorageModule],
  providers: [
    ProvidersService,
    {
      provide: MODEL_PROVIDERS,
      useValue: defaultProviders
    }
  ],
  exports: [ProvidersService]
})
export class ProvidersModule {}
