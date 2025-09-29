import OpenAI from 'openai';
import { ModelProvider, ProviderStreamChunk } from '../model-provider.interface';
import { StoredSession } from '../../session/session.types';

export interface OpenAIProviderConfig {
  id: string;
  displayName: string;
  model: string;
  systemPrompt?: string;
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
    const messages = [
      this.config.systemPrompt
        ? { role: 'system' as const, content: this.config.systemPrompt }
        : null,
      { role: 'user' as const, content: session.prompt }
    ].filter((value): value is { role: 'system' | 'user'; content: string } => Boolean(value));

    const stream = await this.client.chat.completions.create({
      model: this.config.model,
      messages,
      stream: true,
      temperature: 0.7
    });

    try {
      for await (const chunk of stream) {
        const delta = this.extractDelta(chunk);

        if (delta) {
          yield { content: delta };
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

  private extractDelta(chunk: ChatCompletionChunkLike): string | null {
    const choice = chunk.choices[0];
    if (!choice?.delta?.content) {
      return null;
    }

    return choice.delta.content;
  }

  private isFinished(chunk: ChatCompletionChunkLike): boolean {
    return chunk.choices.some((choice) => choice.finish_reason != null);
  }
}

type ChatCompletionChunkLike = {
  choices: Array<{
    delta?: {
      content?: string | null;
    };
    finish_reason?: string | null;
  }>;
};
