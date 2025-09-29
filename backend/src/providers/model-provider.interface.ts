import { StoredSession } from '../session/session.types';

export interface ProviderStreamChunk {
  content: string;
  done?: boolean;
  error?: string;
}

export interface ModelProvider {
  readonly id: string;
  readonly displayName: string;
  readonly supportsStreaming: boolean;
  streamResponse(session: StoredSession): AsyncIterable<ProviderStreamChunk>;
}
