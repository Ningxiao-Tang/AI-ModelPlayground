import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { StreamingModule } from '../streaming/streaming.module';
import { StorageModule } from '../storage/storage.module';
import { MockProvider } from './adapters/mock.provider';
import { OpenAIProvider } from './adapters/openai.provider';
import { MODEL_PROVIDERS } from './providers.constants';
import { ModelProvider } from './model-provider.interface';
import { ProvidersService } from './providers.service';

@Module({
  imports: [ConfigModule, StreamingModule, StorageModule],
  providers: [
    ProvidersService,
    {
      provide: MODEL_PROVIDERS,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): ModelProvider[] =>
        createProviders(configService)
    }
  ],
  exports: [ProvidersService]
})
export class ProvidersModule {}

function createProviders(configService: ConfigService): ModelProvider[] {
  const apiKey = configService.get<string>('OPENAI_API_KEY');

  if (!apiKey) {
    return createMockProviders();
  }

  const baseUrl = configService.get<string>('OPENAI_API_BASE_URL');
  const gpt4Model =
    configService.get<string>('OPENAI_GPT4_MODEL')?.trim() ?? 'gpt-4o-mini';
  const gpt5Model =
    configService.get<string>('OPENAI_GPT5_MODEL')?.trim() ?? 'gpt-4o';

  const gpt4Pricing = getPricing(configService, 'OPENAI_GPT4');
  const gpt5Pricing = getPricing(configService, 'OPENAI_GPT5');

  const client = new OpenAI({
    apiKey,
    ...(baseUrl ? { baseURL: baseUrl } : {})
  });

  return [
    new OpenAIProvider(client, {
      id: 'gpt-4',
      displayName: 'OpenAI GPT-4',
      model: gpt4Model,
      systemPrompt: configService.get<string>('OPENAI_GPT4_SYSTEM_PROMPT') ?? undefined,
      pricing: gpt4Pricing
    }),
    new OpenAIProvider(client, {
      id: 'gpt-5',
      displayName: 'OpenAI GPT-5',
      model: gpt5Model,
      systemPrompt: configService.get<string>('OPENAI_GPT5_SYSTEM_PROMPT') ?? undefined,
      pricing: gpt5Pricing
    })
  ];
}

function createMockProviders(): ModelProvider[] {
  return [
    new MockProvider('mock-gemini', 'Mock Gemini'),
    new MockProvider('mock-claude', 'Mock Claude 3')
  ];
}

function getPricing(configService: ConfigService, prefix: string) {
  const promptCost = parseNumber(configService.get<string>(`${prefix}_PROMPT_COST_PER_1K`));
  const completionCost = parseNumber(
    configService.get<string>(`${prefix}_COMPLETION_COST_PER_1K`)
  );

  if (promptCost == null && completionCost == null) {
    return undefined;
  }

  return {
    promptCostPer1K: promptCost ?? undefined,
    completionCostPer1K: completionCost ?? undefined
  };
}

function parseNumber(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}
