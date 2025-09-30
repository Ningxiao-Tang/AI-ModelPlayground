import { setTimeout as delay } from 'node:timers/promises';
import { ModelProvider, ProviderStreamChunk } from '../model-provider.interface';
import { StoredSession } from '../../session/session.types';

export class MockProvider implements ModelProvider {
  constructor(
    public readonly id: string,
    public readonly displayName: string
  ) {}

  readonly supportsStreaming = true;

  async *streamResponse(session: StoredSession): AsyncIterable<ProviderStreamChunk> {
    const mockChunks = [
      `Hello from ${this.displayName}!`,
      `You asked: "${session.prompt.slice(0, 100)}"`,
      'This is placeholder text while real provider integration is implemented.'
    ];

    let totalLength = 0;

    for (const chunk of mockChunks) {
      await delay(100);
      totalLength += chunk.length;
      yield { content: chunk };
    }

    const approximateTokens = Math.ceil(totalLength / 4);
    const promptTokens = Math.ceil(session.prompt.length / 4);

    yield {
      content: '',
      done: true,
      usage: {
        promptTokens,
        completionTokens: approximateTokens,
        totalTokens: approximateTokens + promptTokens
      }
    } satisfies ProviderStreamChunk;
  }
}
