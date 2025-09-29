import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true
    })
  );

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  Logger.log(`🚀 AI Model Playground backend running on http://localhost:${port}`);
}

bootstrap().catch((error) => {
  Logger.error('Fatal bootstrap error', error.stack);
  process.exitCode = 1;
});
