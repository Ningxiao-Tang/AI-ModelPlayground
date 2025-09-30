import OpenAI from 'openai';
import type {
  ChatCompletionChunk,
  ChatCompletionMessageParam
} from 'openai/resources/chat/completions';
import {
  ModelProvider,
  ProviderStreamChunk,
  ProviderUsageMetrics
} from '../model-provider.interface';
import { StoredSession } from '../../session/session.types';

export interface OpenAIProviderConfig {
  id: string;
  displayName: string;
  model: string;
  systemPrompt?: string;
  pricing?: {
    promptCostPer1K?: number;
    completionCostPer1K?: number;
  };
}

export class OpenAIProvider implements ModelProvider {
  readonly supportsStreaming = true;

  constructor(private readonly client: OpenAI, private readonly config: OpenAIProviderConfig) {}

  get id(): string {
    return this.config.id;
  }

  get displayName(): string {
    return this.config.displayName;
  }

  async *streamResponse(session: StoredSession): AsyncIterable<ProviderStreamChunk> {
    const messages: ChatCompletionMessageParam[] = [];

    if (this.config.systemPrompt) {
      messages.push({ role: 'system', content: this.config.systemPrompt });
    }

    messages.push({ role: 'user', content: session.prompt });

    const stream = await this.client.chat.completions.create({
      model: this.config.model,
      messages,
      stream: true,
      temperature: 0.7,
      stream_options: {
        include_usage: true
      }
    });

    try {
      for await (const chunk of stream) {
        const delta = this.extractDelta(chunk);
        const usage = this.extractUsage(chunk);

        if (delta) {
          yield { content: delta };
        }

        if (usage) {
          yield { content: '', usage };
        }

        if (this.isFinished(chunk)) {
          break;
        }
      }

      yield { content: '', done: true };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error while streaming from OpenAI';
      yield { content: '', error: message };
      return;
    }
  }

  private extractDelta(chunk: ChatCompletionChunk): string | null {
    const choice = chunk.choices[0];
    if (!choice?.delta?.content) {
      return null;
    }

    return choice.delta.content;
  }

  private isFinished(chunk: ChatCompletionChunk): boolean {
    return chunk.choices.some((choice) => choice.finish_reason != null);
  }

  private extractUsage(chunk: ChatCompletionChunk): ProviderUsageMetrics | null {
    if (!chunk.usage) {
      return null;
    }

    const { prompt_tokens, completion_tokens, total_tokens } = chunk.usage;

    const usage: ProviderUsageMetrics = {
      promptTokens: prompt_tokens ?? undefined,
      completionTokens: completion_tokens ?? undefined,
      totalTokens: total_tokens ?? undefined
    };

    const estimatedCost = this.estimateCost(prompt_tokens, completion_tokens);
    if (estimatedCost != null) {
      usage.estimatedCostUsd = estimatedCost;
    }

    return usage;
  }

  private estimateCost(
    promptTokens?: number,
    completionTokens?: number
  ): number | null {
    const promptRate = this.config.pricing?.promptCostPer1K;
    const completionRate = this.config.pricing?.completionCostPer1K;

    if (promptRate == null && completionRate == null) {
      return null;
    }

    const promptCost = promptTokens && promptRate != null ? (promptTokens / 1000) * promptRate : 0;
    const completionCost =
      completionTokens && completionRate != null ? (completionTokens / 1000) * completionRate : 0;

    const total = promptCost + completionCost;
    return Number.isFinite(total) ? Number(total.toFixed(6)) : null;
  }
}
