import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ExpressAdapter } from '@nestjs/platform-express';
import { INestApplication } from '@nestjs/common';
import express, { Request, Response } from 'express';

const server = express();
let app: INestApplication;

async function bootstrap() {
  if (!app) {
    app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(server),
      { logger: ['error', 'warn', 'log'] }
    );
    
    app.useGlobalPipes(
      new ValidationPipe({ 
        whitelist: true, 
        transform: true 
      })
    );
    
    // Build CORS origins from environment variable
    const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || [];
    
    if (allowedOrigins.length === 0) {
      throw new Error('CORS_ORIGINS environment variable is required');
    }
    
    app.enableCors({
      origin: allowedOrigins,
      credentials: true,
    });

    const config = new DocumentBuilder()
      .setTitle('Multi-Tenant CRM API')
      .setDescription('Production-grade CRM system with multi-tenancy')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'JWT-auth'
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      customSiteTitle: 'Multi-Tenant CRM API',
      customCss: '.swagger-ui .topbar { display: none }',
      swaggerOptions: {
        persistAuthorization: true,
      },
      customfavIcon: 'https://nestjs.com/img/logo-small.svg',
      customJs: [
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.js',
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.js',
      ],
      customCssUrl: [
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css',
      ],
    });

    await app.init();
  }
  return app;
}

// Export for Vercel
export default async (req: Request, res: Response) => {
  await bootstrap();
  return server(req, res);
};
