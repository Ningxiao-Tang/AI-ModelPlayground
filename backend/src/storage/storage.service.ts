import { Injectable, Logger } from '@nestjs/common';
import {
  ModelMetrics,
  ModelResponseState,
  SessionRecord,
  StoredSession
} from '../session/session.types';

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
      const startedAt = new Date().toISOString();
      modelState.metrics.startedAt = startedAt;
      modelState.errorMessage = undefined;
    });
  }

  async appendModelChunk(sessionId: string, modelId: string, chunk: string): Promise<void> {
    this.updateModel(sessionId, modelId, (modelState) => {
      modelState.chunks.push(chunk);
      modelState.metrics.chunkCount += 1;
      modelState.metrics.totalChars += chunk.length;
    });
  }

  async markModelAsCompleted(sessionId: string, modelId: string): Promise<void> {
    this.updateModel(sessionId, modelId, (modelState) => {
      modelState.status = 'completed';
      const completedAt = new Date().toISOString();
      modelState.metrics.completedAt = completedAt;
      modelState.metrics.durationMs = this.computeDuration(
        modelState.metrics.startedAt,
        completedAt
      );
    });
  }

  async markModelAsError(sessionId: string, modelId: string, errorMessage: string): Promise<void> {
    this.updateModel(sessionId, modelId, (modelState) => {
      modelState.status = 'error';
      modelState.errorMessage = errorMessage;
      const completedAt = new Date().toISOString();
      modelState.metrics.completedAt = completedAt;
      modelState.metrics.durationMs = this.computeDuration(
        modelState.metrics.startedAt,
        completedAt
      );
    });
  }

  async updateModelUsage(
    sessionId: string,
    modelId: string,
    usage: {
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
      estimatedCostUsd?: number;
    }
  ): Promise<ModelMetrics | null> {
    let metrics: ModelMetrics | null = null;
    this.updateModel(sessionId, modelId, (modelState) => {
      const totalTokens =
        usage.totalTokens ??
        (usage.promptTokens != null || usage.completionTokens != null
          ? (usage.promptTokens ?? 0) + (usage.completionTokens ?? 0)
          : undefined);
      modelState.metrics = {
        ...modelState.metrics,
        ...usage,
        totalTokens
      };
      metrics = this.clone(modelState.metrics);
    });

    return metrics;
  }

  async getModelMetrics(sessionId: string, modelId: string): Promise<ModelMetrics | null> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    const model = session.responses[modelId];
    if (!model) {
      return null;
    }

    return this.clone(model.metrics);
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
      chunks: [],
      metrics: {
        chunkCount: 0,
        totalChars: 0
      }
    };
  }

  private clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
  }

  private computeDuration(startedAt?: string, completedAt?: string): number | undefined {
    if (!startedAt || !completedAt) {
      return undefined;
    }

    const start = new Date(startedAt).getTime();
    const end = new Date(completedAt).getTime();

    if (Number.isNaN(start) || Number.isNaN(end)) {
      return undefined;
    }

    return Math.max(end - start, 0);
  }
}
