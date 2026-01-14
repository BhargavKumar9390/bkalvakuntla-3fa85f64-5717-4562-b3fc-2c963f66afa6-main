/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as swaggerUi from 'swagger-ui-express';

import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // Minimal OpenAPI document generated from Express routes and served with swagger-ui-express
  const server: any = app.getHttpAdapter().getInstance();
  const paths: Record<string, any> = {};
  // Express stores routes in server._router.stack — collect paths and methods
  (server._router?.stack || []).forEach((layer: any) => {
    if (layer.route && layer.route.path && layer.route.methods) {
      const rawPath = layer.route.path;
      const methods = Object.keys(layer.route.methods || {});
      // convert Express params :id to OpenAPI {id}
      const openapiPath = rawPath.replace(/:([a-zA-Z0-9_]+)/g, '{$1}');
      paths[openapiPath] = paths[openapiPath] || {};
      methods.forEach((m) => {
        paths[openapiPath][m] = {
          summary: `Auto-generated ${m.toUpperCase()} ${openapiPath}`,
          responses: { '200': { description: 'OK' } },
          security: [{ bearerAuth: [] }],
        };
      });
    }
  });

  const openApiSpec = {
    openapi: '3.0.0',
    info: { title: 'Task Management API', version: '1.0', description: 'Auto-generated minimal OpenAPI from routes' },
    servers: [{ url: `http://localhost:${process.env.PORT || 3000}/${globalPrefix}` }],
    paths,
    components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
  };

  app.use(`/${globalPrefix}/docs`, swaggerUi.serve, swaggerUi.setup(openApiSpec));

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);
  Logger.log(`📚 Swagger UI available at http://localhost:${port}/${globalPrefix}/docs`);
}

bootstrap();
