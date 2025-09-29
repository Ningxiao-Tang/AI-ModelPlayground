import { Module } from '@nestjs/common';
import { StreamingController } from './streaming.controller';
import { StreamingService } from './streaming.service';

@Module({
  providers: [StreamingService],
  controllers: [StreamingController],
  exports: [StreamingService]
})
export class StreamingModule {}
