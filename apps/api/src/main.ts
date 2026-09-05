import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import express from 'express';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));

  // Middleware & Body limits (50mb for image/file uploads)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use(cookieParser());

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('TripOS API')
    .setDescription('Group Trip Operating System API')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Enable CORS for local & production web frontends
  const allowedOrigins = [
    'http://localhost:3000',
    'https://tripos-app-kappa.vercel.app',
    process.env.FRONTEND_URL,
    process.env.APP_URL,
  ].filter(Boolean) as (string | RegExp)[];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive fallback for seamless API access
      }
    },
    credentials: true,
  });

  app.useGlobalFilters(app.get(AllExceptionsFilter));

  const port = process.env.PORT || 3001;
  await app.listen(port);

  const logger = app.get(Logger);
  logger.log(`TripOS API running at http://localhost:${port}`, 'Bootstrap');
  logger.log(`Swagger Docs available at http://localhost:${port}/api/docs`, 'Bootstrap');
}

bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
