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

    for (const chunk of mockChunks) {
      await delay(100);
      yield { content: chunk };
    }

    yield { content: '', done: true };
  }
}
