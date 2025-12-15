import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  // const app = await NestFactory.create(AppModule);
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });
  app.enableCors();

  // Swagger Code
  const config = new DocumentBuilder()
    .setTitle('Blog API') // Title of your API
    .setDescription('This API allows you to manage blog posts, users, and more.') // Description
    .setVersion('1.0') // Version
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT') // Optional: JWT Auth
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Swagger Route
  SwaggerModule.setup('blogging-docs', app, document);
  // Start The server
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Swagger docs available on http://localhost:${port}/blogging-docs`);
}

bootstrap();
