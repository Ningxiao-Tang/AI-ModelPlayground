export interface ModelMetricsPayload {
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

export type StreamingEvent =
  | { type: 'session.status'; status: string }
  | { type: 'session.error'; error: string }
  | { type: 'session.completed' }
  | { type: 'model.status'; modelId: string; status: string }
  | { type: 'model.chunk'; modelId: string; content: string }
  | { type: 'model.error'; modelId: string; error: string }
  | { type: 'model.metrics'; modelId: string; metrics: ModelMetricsPayload };
