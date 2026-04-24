import 'dotenv/config';
import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

function parseAllowedCorsOrigins() {
  const configuredOrigins =
    process.env.CORS_ALLOWED_ORIGINS ??
    'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173';

  return new Set(
    configuredOrigins
      .split(',')
      .map((origin) => origin.trim().replace(/\/$/, ''))
      .filter(Boolean)
      .map((configuredValue) => {
        try {
          return new URL(configuredValue).origin;
        } catch {
          return configuredValue;
        }
      }),
  );
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  const allowedOrigins = parseAllowedCorsOrigins();

  app.enableCors({
    origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS`), false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, '0.0.0.0');
  console.log(`Backend listening on http://0.0.0.0:${port}`);
}

bootstrap();
