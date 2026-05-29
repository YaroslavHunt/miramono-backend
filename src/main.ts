import { resolve } from 'node:path';

import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  const uploadsDir = resolve(config.get<string>('upload.dir') ?? 'uploads');
  const uploadsServePath = config.get<string>('upload.servePath') ?? '/uploads';
  app.useStaticAssets(uploadsDir, { prefix: uploadsServePath });

  const corsOrigins = config.get<string[]>('app.corsOrigins') ?? [];
  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : true,
    credentials: true,
  });

  app.setGlobalPrefix('api', { exclude: ['health', 'sitemap.xml', 'robots.txt'] });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('MIRAMONO Dentistry API')
    .setDescription('REST API for the MIRAMONO Dentistry clinic website')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig));

  const port = config.get<number>('app.port') ?? 3000;
  await app.listen(port);
}

void bootstrap();
