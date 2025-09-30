import { StoredSession } from '../session/session.types';

export interface ProviderUsageMetrics {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  estimatedCostUsd?: number;
}

export interface ProviderStreamChunk {
  content: string;
  done?: boolean;
  error?: string;
  usage?: ProviderUsageMetrics;
}

export interface ModelProvider {
  readonly id: string;
  readonly displayName: string;
  readonly supportsStreaming: boolean;
  streamResponse(session: StoredSession): AsyncIterable<ProviderStreamChunk>;
}
