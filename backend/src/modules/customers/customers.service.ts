import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import {
  Repository,
  DataSource,
} from 'typeorm';

import { Customer } from './entities/customer.entity';

import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { ActivityLogService } from '../activity-log/activity-log.service';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,

    private readonly dataSource: DataSource,

    private readonly activityLogService: ActivityLogService,
  ) {}

  // CREATE CUSTOMER
  async create(
    createCustomerDto: CreateCustomerDto,
    currentUser: any,
  ) {
    const customer = this.customerRepository.create({
      ...createCustomerDto,

      // Multi-tenancy enforcement
      organizationId: currentUser.organizationId,
    });

    const savedCustomer = await this.customerRepository.save(customer);

    // Log activity
    await this.activityLogService.log(
      'customer_created',
      'customer',
      savedCustomer.id,
      currentUser.organizationId,
      currentUser.userId,
      { name: savedCustomer.name, email: savedCustomer.email },
    );

    return savedCustomer;
  }

  // GET ALL CUSTOMERS
  async findAll(
    currentUser: any,
    page = 1,
    limit = 10,
    search?: string,
  ) {
    const query = this.customerRepository
      .createQueryBuilder('customer')

      // Multi-tenancy enforcement
      .where(
        'customer.organizationId = :organizationId',
        {
          organizationId: currentUser.organizationId,
        },
      )

      // Soft delete filtering
      .andWhere('customer.deletedAt IS NULL');

    // Search support
    if (search) {
      query.andWhere(
        '(customer.name ILIKE :search OR customer.email ILIKE :search)',
        {
          search: `%${search}%`,
        },
      );
    }

    // Pagination
    query.skip((page - 1) * limit).take(limit);

    const [customers, total] =
      await query.getManyAndCount();

    return {
      data: customers,
      total,
      page,
      limit,
    };
  }

  // GET SINGLE CUSTOMER
  async findOne(
    id: string,
    currentUser: any,
  ) {
    const customer =
      await this.customerRepository.findOne({
        where: {
          id,

          // Multi-tenancy enforcement
          organizationId:
            currentUser.organizationId,
        },
      });

    if (!customer) {
      throw new NotFoundException(
        'Customer not found',
      );
    }

    return customer;
  }

  // UPDATE CUSTOMER
  async update(
    id: string,
    updateCustomerDto: UpdateCustomerDto,
    currentUser: any,
  ) {
    const customer = await this.findOne(id, currentUser);

    await this.customerRepository.update(
      {
        id,

        // Multi-tenancy enforcement
        organizationId:
          currentUser.organizationId,
      },
      updateCustomerDto,
    );

    // Log activity
    await this.activityLogService.log(
      'customer_updated',
      'customer',
      id,
      currentUser.organizationId,
      currentUser.userId,
      { changes: updateCustomerDto },
    );

    return this.findOne(id, currentUser);
  }

  // SOFT DELETE CUSTOMER
  async remove(
    id: string,
    currentUser: any,
  ) {
    const customer = await this.findOne(id, currentUser);

    const result = await this.customerRepository.softDelete({
      id,

      // Multi-tenancy enforcement
      organizationId:
        currentUser.organizationId,
    });

    // Log activity
    await this.activityLogService.log(
      'customer_deleted',
      'customer',
      id,
      currentUser.organizationId,
      currentUser.userId,
      { name: customer.name },
    );

    return result;
  }

  // CONCURRENCY-SAFE ASSIGNMENT
  async assignCustomer(
    customerId: string,
    userId: string,
    currentUser: any,
  ) {
    const result = await this.dataSource.transaction(
      async (manager) => {
        // Lock rows during assignment
        const activeAssignments =
          await manager
            .createQueryBuilder(
              Customer,
              'customer',
            )
            .setLock('pessimistic_write')
            .where(
              'customer.assignedTo = :userId',
              {
                userId,
              },
            )
            .andWhere(
              'customer.deletedAt IS NULL',
            )
            .getCount();

        // Prevent exceeding limit
        if (activeAssignments >= 5) {
          throw new BadRequestException(
            'User already has maximum 5 active customers',
          );
        }

        // Assign customer
        await manager.update(
          Customer,
          {
            id: customerId,

            // Multi-tenancy enforcement
            organizationId:
              currentUser.organizationId,
          },
          {
            assignedTo: userId,
          },
        );

        return await manager.findOne(Customer, {
          where: {
            id: customerId,
          },
        });
      },
    );

    // Log activity
    await this.activityLogService.log(
      'customer_assigned',
      'customer',
      customerId,
      currentUser.organizationId,
      currentUser.userId,
      { assignedTo: userId },
    );

    return result;
  }

  // RESTORE SOFT-DELETED CUSTOMER
  async restore(
    id: string,
    currentUser: any,
  ) {
    const customer =
      await this.customerRepository.findOne({
        where: {
          id,

          // Multi-tenancy enforcement
          organizationId:
            currentUser.organizationId,
        },
        withDeleted: true,
      });

    if (!customer) {
      throw new NotFoundException(
        'Customer not found',
      );
    }

    if (!customer.deletedAt) {
      throw new BadRequestException(
        'Customer is not deleted',
      );
    }

    await this.customerRepository.restore(id);

    // Log activity
    await this.activityLogService.log(
      'customer_restored',
      'customer',
      id,
      currentUser.organizationId,
      currentUser.userId,
      { name: customer.name },
    );

    return this.findOne(id, currentUser);
  }
}