import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ProvidersService } from '../providers/providers.service';
import { StorageService } from '../storage/storage.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { SessionRecord, StoredSession } from './session.types';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    private readonly providersService: ProvidersService,
    private readonly storageService: StorageService
  ) {}

  async startSession(dto: CreateSessionDto): Promise<StoredSession> {
    const now = new Date().toISOString();
    const session: SessionRecord = {
      id: randomUUID(),
      prompt: dto.prompt,
      modelIds: dto.modelIds,
      status: 'pending',
      createdAt: now,
      updatedAt: now
    };

    const storedSession = await this.storageService.saveSession(session);

    this.providersService
      .executeComparison(storedSession)
      .catch((error) => this.handleSessionError(session.id, error));

    return storedSession;
  }

  async getSession(sessionId: string): Promise<StoredSession | null> {
    return this.storageService.getSession(sessionId);
  }

  private async handleSessionError(sessionId: string, error: Error): Promise<void> {
    this.logger.error(`Session ${sessionId} failed`, error.stack);
    await this.storageService.markSessionAsError(sessionId, error.message);
  }
}
