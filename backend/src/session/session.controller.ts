import { Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { CreateSessionDto } from './dto/create-session.dto';
import { SessionService } from './session.service';

@Controller('sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post()
  async createSession(@Body() dto: CreateSessionDto) {
    return this.sessionService.startSession(dto);
  }

  @Get(':id')
  async findSession(@Param('id') sessionId: string) {
    const session = await this.sessionService.getSession(sessionId);

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    return session;
  }
}
