import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      message: '🚀 Multi-Tenant CRM API is running!',
      version: '1.0.0',
      documentation: '/api/docs',
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
