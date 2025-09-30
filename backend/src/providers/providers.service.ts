import { Inject, Injectable, Logger } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { SessionRecord, StoredSession } from '../session/session.types';
import { StreamingService } from '../streaming/streaming.service';
import { MODEL_PROVIDERS } from './providers.constants';
import { ModelProvider } from './model-provider.interface';

export interface ProviderSummary {
  id: string;
  displayName: string;
  supportsStreaming: boolean;
}

@Injectable()
export class ProvidersService {
  private readonly logger = new Logger(ProvidersService.name);

  constructor(
    @Inject(MODEL_PROVIDERS) private readonly providers: ModelProvider[],
    private readonly storageService: StorageService,
    private readonly streamingService: StreamingService
  ) {}

  listProviders(): ProviderSummary[] {
    return this.providers.map((provider) => ({
      id: provider.id,
      displayName: provider.displayName,
      supportsStreaming: provider.supportsStreaming
    }));
  }

  async executeComparison(session: StoredSession | SessionRecord): Promise<void> {
    const resolvedSession =
      'responses' in session ? session : await this.storageService.getSession(session.id);

    if (!resolvedSession) {
      this.logger.warn(`Session ${session.id} disappeared before execution started`);
      return;
    }

    await this.storageService.markSessionAsRunning(resolvedSession.id);
    this.streamingService.emitSessionStatus(resolvedSession.id, 'running');

    const results = await Promise.allSettled(
      resolvedSession.modelIds.map((modelId) => this.executeForModel(resolvedSession, modelId))
    );

    const hasFailure = results.some((result) => result.status === 'rejected');

    if (hasFailure) {
      this.streamingService.emitSessionError(resolvedSession.id, 'One or more models failed');
      await this.storageService.markSessionAsError(resolvedSession.id, 'One or more models failed');
      return;
    }

    await this.storageService.markSessionAsCompleted(resolvedSession.id);
    this.streamingService.emitSessionCompleted(resolvedSession.id);
  }

  private async executeForModel(session: StoredSession, modelId: string): Promise<void> {
    const provider = this.providers.find((item) => item.id === modelId);

    if (!provider) {
      const error = `Unknown provider ${modelId}`;
      this.logger.error(error);
      this.streamingService.emitModelError(session.id, modelId, error);
      await this.storageService.markModelAsError(session.id, modelId, error);
      throw new Error(error);
    }

    await this.storageService.markModelAsRunning(session.id, modelId);
    this.streamingService.emitModelStatus(session.id, modelId, 'running');

    try {
      for await (const chunk of provider.streamResponse(session)) {
        if (chunk.error) {
          this.streamingService.emitModelError(session.id, modelId, chunk.error);
          await this.storageService.markModelAsError(session.id, modelId, chunk.error);
          throw new Error(chunk.error);
        }

        if (chunk.content) {
          await this.storageService.appendModelChunk(session.id, modelId, chunk.content);
          this.streamingService.emitModelChunk(session.id, modelId, chunk.content);
          const metrics = await this.storageService.getModelMetrics(session.id, modelId);
          if (metrics) {
            this.streamingService.emitModelMetrics(session.id, modelId, metrics);
          }
        }

        if (chunk.usage) {
          const metrics = await this.storageService.updateModelUsage(session.id, modelId, {
            promptTokens: chunk.usage.promptTokens,
            completionTokens: chunk.usage.completionTokens,
            totalTokens: chunk.usage.totalTokens,
            estimatedCostUsd: chunk.usage.estimatedCostUsd
          });

          if (metrics) {
            this.streamingService.emitModelMetrics(session.id, modelId, metrics);
          }
        }
      }

      await this.storageService.markModelAsCompleted(session.id, modelId);
      const metrics = await this.storageService.getModelMetrics(session.id, modelId);
      if (metrics) {
        this.streamingService.emitModelMetrics(session.id, modelId, metrics);
      }
      this.streamingService.emitModelStatus(session.id, modelId, 'completed');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown provider error';
      this.streamingService.emitModelError(session.id, modelId, message);
      await this.storageService.markModelAsError(session.id, modelId, message);
      const metrics = await this.storageService.getModelMetrics(session.id, modelId);
      if (metrics) {
        this.streamingService.emitModelMetrics(session.id, modelId, metrics);
      }
      throw error;
    }
  }
}
