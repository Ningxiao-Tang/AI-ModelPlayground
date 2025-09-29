import { Injectable, Logger } from '@nestjs/common';
import { ModelResponseState, SessionRecord, StoredSession } from '../session/session.types';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly sessions = new Map<string, StoredSession>();

  async saveSession(session: SessionRecord): Promise<StoredSession> {
    const responses: Record<string, ModelResponseState> = Object.fromEntries(
      session.modelIds.map((modelId) => [modelId, this.createInitialModelState(modelId)])
    );

    const stored: StoredSession = {
      ...session,
      responses
    };

    this.sessions.set(session.id, stored);
    return this.clone(stored);
  }

  async getSession(sessionId: string): Promise<StoredSession | null> {
    const session = this.sessions.get(sessionId);
    return session ? this.clone(session) : null;
  }

  async markSessionAsRunning(sessionId: string): Promise<void> {
    this.updateSession(sessionId, (session) => {
      session.status = 'running';
      session.updatedAt = new Date().toISOString();
    });
  }

  async markSessionAsCompleted(sessionId: string): Promise<void> {
    this.updateSession(sessionId, (session) => {
      session.status = 'completed';
      session.updatedAt = new Date().toISOString();
    });
  }

  async markSessionAsError(sessionId: string, errorMessage: string): Promise<void> {
    this.updateSession(sessionId, (session) => {
      session.status = 'error';
      session.errorMessage = errorMessage;
      session.updatedAt = new Date().toISOString();
    });
  }

  async markModelAsRunning(sessionId: string, modelId: string): Promise<void> {
    this.updateModel(sessionId, modelId, (modelState) => {
      modelState.status = 'running';
      modelState.startedAt = new Date().toISOString();
    });
  }

  async appendModelChunk(sessionId: string, modelId: string, chunk: string): Promise<void> {
    this.updateModel(sessionId, modelId, (modelState) => {
      modelState.chunks.push(chunk);
    });
  }

  async markModelAsCompleted(sessionId: string, modelId: string): Promise<void> {
    this.updateModel(sessionId, modelId, (modelState) => {
      modelState.status = 'completed';
      modelState.completedAt = new Date().toISOString();
    });
  }

  async markModelAsError(sessionId: string, modelId: string, errorMessage: string): Promise<void> {
    this.updateModel(sessionId, modelId, (modelState) => {
      modelState.status = 'error';
      modelState.errorMessage = errorMessage;
      modelState.completedAt = new Date().toISOString();
    });
  }

  private updateSession(sessionId: string, mutator: (session: StoredSession) => void): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      this.logger.warn(`Attempted to update missing session ${sessionId}`);
      return;
    }

    mutator(session);
  }

  private updateModel(
    sessionId: string,
    modelId: string,
    mutator: (modelState: ModelResponseState) => void
  ): void {
    this.updateSession(sessionId, (session) => {
      const modelState = session.responses[modelId];
      if (!modelState) {
        this.logger.warn(`Attempted to update missing model ${modelId} in session ${sessionId}`);
        return;
      }

      mutator(modelState);
    });
  }

  private createInitialModelState(modelId: string): ModelResponseState {
    return {
      modelId,
      status: 'pending',
      chunks: []
    };
  }

  private clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
  }
}
