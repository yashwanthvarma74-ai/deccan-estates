import './tracing';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { UPLOAD_DIR } from './posting/storage.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // WEB_ORIGIN may list several sites separated by commas (for example the Vercel address and a custom domain).
  const origins = (process.env.WEB_ORIGIN ?? 'http://localhost:3000').split(',').map((o) => o.trim().replace(/\/$/, '')).filter(Boolean);
  app.enableCors({ origin: origins, credentials: true });
  // Photos are served as plain images; nosniff stops a browser treating one as anything else.
  app.useStaticAssets(UPLOAD_DIR, { prefix: '/uploads', maxAge: '7d', setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff') });
  const config = new DocumentBuilder()
    .setTitle('Hyderabad Real Estate API')
    .setVersion('0.1')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));
  // Hosts such as Render tell the app which port to use through PORT.
  await app.listen(Number(process.env.API_PORT ?? process.env.PORT ?? 4000), '0.0.0.0');
}
bootstrap();
