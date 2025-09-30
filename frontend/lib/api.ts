export interface SessionResponse {
  id: string;
  prompt: string;
  modelIds: string[];
  status: string;
}

export interface CreateSessionPayload {
  prompt: string;
  modelIds: string[];
}

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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

export async function createSession(payload: CreateSessionPayload): Promise<SessionResponse> {
  const response = await fetch(`${API_BASE_URL}/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Failed to create session: ${response.statusText}`);
  }

  return (await response.json()) as SessionResponse;
}

export type StreamingMessage =
  | { type: 'session.status'; status: string }
  | { type: 'session.error'; error: string }
  | { type: 'session.completed' }
  | { type: 'model.status'; modelId: string; status: string }
  | { type: 'model.chunk'; modelId: string; content: string }
  | { type: 'model.error'; modelId: string; error: string }
  | { type: 'model.metrics'; modelId: string; metrics: ModelMetricsPayload };

export function openSessionStream(
  sessionId: string,
  onMessage: (event: StreamingMessage) => void,
  onError: (error: Event) => void
): EventSource {
  const eventSource = new EventSource(`${API_BASE_URL}/sessions/${sessionId}/stream`);

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as StreamingMessage;
      onMessage(data);
    } catch (error) {
      console.error('Failed to parse streaming message', error);
    }
  };

  eventSource.onerror = onError;

  return eventSource;
}
