import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { CustomersModule } from './customers/customers.module';
import { NotesModule } from './notes/notes.module';
import { ActivityLogModule } from './activity-log/activity-log.module';
import { OrganizationsModule } from './organizations/organizations.module';


@Module({
  imports: [UsersModule, CustomersModule, NotesModule, ActivityLogModule, OrganizationsModule],
})
export class AppModule {}
