import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { getDatabaseConfig } from './database/database.config';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CustomersModule } from './modules/customers/customers.module';
import { NotesModule } from './modules/notes/notes.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { ActivityLogModule } from './modules/activity-log/activity-log.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),

    AuthModule,
    UsersModule,
    CustomersModule,
    NotesModule,
    OrganizationsModule,
    ActivityLogModule,
  ],
})
export class AppModule {}
