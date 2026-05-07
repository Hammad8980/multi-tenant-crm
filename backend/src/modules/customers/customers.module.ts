import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';

import { Customer } from './entities/customer.entity';
import { ActivityLogModule } from '../activity-log/activity-log.module';

@Module({
  imports: [TypeOrmModule.forFeature([Customer]), ActivityLogModule],

  controllers: [CustomersController],

  providers: [CustomersService],
})
export class CustomersModule {}
