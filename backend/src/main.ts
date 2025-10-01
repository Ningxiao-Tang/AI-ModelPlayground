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

  const port = process.env.PORT ?? 10000;
  const host = '0.0.0.0';
  await app.listen(port, host);
  Logger.log(`🚀 AI Model Playground backend running on http://${host}:${port}`);
}

bootstrap().catch((error) => {
  Logger.error('Fatal bootstrap error', error.stack);
  process.exitCode = 1;
});
