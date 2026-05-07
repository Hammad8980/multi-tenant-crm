import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';

@Controller()
export class AppController {
  @Get()
  getRoot(@Req() req: Request) {
    const protocol =
      (req.headers['x-forwarded-proto'] as string) || req.protocol;
    const host =
      (req.headers['x-forwarded-host'] as string) ||
      req.get('host') ||
      'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    return {
      message: '🚀 Multi-Tenant CRM API is running!',
      version: '1.0.0',
      documentation: {
        swagger: '/api/docs',
        openApiJson: '/api/docs-json',
        externalViewer: `https://petstore.swagger.io/?url=${baseUrl}/api/docs-json`,
      },
      endpoints: {
        auth: '/auth',
        users: '/users',
        customers: '/customers',
        notes: '/notes',
        organizations: '/organizations',
        activityLogs: '/activity-logs',
      },
    };
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
