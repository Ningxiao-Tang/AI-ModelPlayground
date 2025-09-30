export type SessionStatus = 'pending' | 'running' | 'completed' | 'error';
export type ModelStatus = 'pending' | 'running' | 'completed' | 'error';

export interface SessionRecord {
  id: string;
  prompt: string;
  modelIds: string[];
  status: SessionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ModelMetrics {
  chunkCount: number;
  totalChars: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  estimatedCostUsd?: number;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
}

export interface ModelResponseState {
  modelId: string;
  status: ModelStatus;
  chunks: string[];
  metrics: ModelMetrics;
  errorMessage?: string;
}

export interface StoredSession extends SessionRecord {
  errorMessage?: string;
  responses: Record<string, ModelResponseState>;
}
