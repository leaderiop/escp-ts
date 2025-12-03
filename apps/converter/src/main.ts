import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';
import { patchNestJsSwagger } from 'nestjs-zod';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  patchNestJsSwagger();

  const app = await NestFactory.create(AppModule);

  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('ESC/P Converter API')
    .setDescription(
      `
REST API for converting ESC/P and ESC/P2 PRN files to PDF or PNG format.

## Overview
This API wraps the [PrinterToPDF](https://github.com/RWAP/PrinterToPDF) converter,
providing a RESTful interface for converting dot matrix printer output files.

## Resources

### Conversions
Create conversions from PRN files to PDF or PNG format. Supports:
- Multipart file upload
- JSON with base64-encoded content
- All PrinterToPDF options (page size, margins, printer mode, etc.)

### Formats
Discover supported output formats, page sizes, and conversion options.

### Health
Monitor service health, liveness, and readiness.

## Error Handling
All errors follow [RFC 7807](https://datatracker.ietf.org/doc/html/rfc7807) Problem Details format.
      `.trim()
    )
    .setVersion('1.0.0')
    .addTag('conversions', 'Create and manage file conversions')
    .addTag('formats', 'Discover supported formats and options')
    .addTag('health', 'Service health monitoring')
    .setContact('ESC/P Team', 'https://github.com/escp-ts', 'support@escp.dev')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addServer('http://localhost:3000', 'Local development')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      tagsSorter: 'alpha',
      operationsSorter: 'method',
    },
  });

  app.getHttpAdapter().get('/openapi.json', (_req, res) => {
    res.json(document);
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Swagger UI: http://localhost:${port}/docs`);
  logger.log(`OpenAPI spec: http://localhost:${port}/openapi.json`);
}

bootstrap();
