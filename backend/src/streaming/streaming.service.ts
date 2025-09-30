import { Injectable } from '@nestjs/common';
import { Observable, ReplaySubject } from 'rxjs';
import { ModelMetricsPayload, StreamingEvent } from './streaming.types';

@Injectable()
export class StreamingService {
  private readonly streams = new Map<string, ReplaySubject<StreamingEvent>>();

  getSessionStream(sessionId: string): Observable<StreamingEvent> {
    return this.getOrCreateStream(sessionId).asObservable();
  }

  emitSessionStatus(sessionId: string, status: string): void {
    this.getOrCreateStream(sessionId).next({ type: 'session.status', status });
  }

  emitSessionError(sessionId: string, error: string): void {
    this.getOrCreateStream(sessionId).next({ type: 'session.error', error });
  }

  emitSessionCompleted(sessionId: string): void {
    this.getOrCreateStream(sessionId).next({ type: 'session.completed' });
    this.complete(sessionId);
  }

  emitModelStatus(sessionId: string, modelId: string, status: string): void {
    this.getOrCreateStream(sessionId).next({ type: 'model.status', modelId, status });
  }

  emitModelChunk(sessionId: string, modelId: string, content: string): void {
    this.getOrCreateStream(sessionId).next({ type: 'model.chunk', modelId, content });
  }

  emitModelError(sessionId: string, modelId: string, error: string): void {
    this.getOrCreateStream(sessionId).next({ type: 'model.error', modelId, error });
  }

  emitModelMetrics(
    sessionId: string,
    modelId: string,
    metrics: ModelMetricsPayload
  ): void {
    this.getOrCreateStream(sessionId).next({ type: 'model.metrics', modelId, metrics });
  }

  private complete(sessionId: string): void {
    const stream = this.streams.get(sessionId);
    if (stream) {
      stream.complete();
      this.streams.delete(sessionId);
    }
  }

  private getOrCreateStream(sessionId: string): ReplaySubject<StreamingEvent> {
    let stream = this.streams.get(sessionId);
    if (!stream) {
      stream = new ReplaySubject<StreamingEvent>(50);
      this.streams.set(sessionId, stream);
    }
    return stream;
  }
}
