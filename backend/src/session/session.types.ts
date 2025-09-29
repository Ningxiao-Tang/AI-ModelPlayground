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

export interface ModelResponseState {
  modelId: string;
  status: ModelStatus;
  chunks: string[];
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface StoredSession extends SessionRecord {
  errorMessage?: string;
  responses: Record<string, ModelResponseState>;
}
