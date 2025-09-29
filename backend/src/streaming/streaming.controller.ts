import { Controller, Param, Sse } from '@nestjs/common';
import { MessageEvent } from '@nestjs/common/interfaces';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StreamingService } from './streaming.service';
import { StreamingEvent } from './streaming.types';

@Controller()
export class StreamingController {
  constructor(private readonly streamingService: StreamingService) {}

  @Sse('sessions/:id/stream')
  streamSession(@Param('id') sessionId: string): Observable<MessageEvent> {
    return this.streamingService.getSessionStream(sessionId).pipe(
      map((event: StreamingEvent) => ({ data: event }))
    );
  }
}
