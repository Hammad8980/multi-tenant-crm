import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository, DataSource } from 'typeorm';

import { Customer } from './entities/customer.entity';

import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { ActivityLogService } from '../activity-log/activity-log.service';
import {
  DEFAULT_PAGE_SIZE,
  MAX_CUSTOMERS_PER_USER,
} from '../../common/constants';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,

    private readonly dataSource: DataSource,

    private readonly activityLogService: ActivityLogService,
  ) {}

  // CREATE CUSTOMER
  async create(createCustomerDto: CreateCustomerDto, currentUser: any) {
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
    limit = DEFAULT_PAGE_SIZE,
    search?: string,
    includeDeleted = false,
  ) {
    const query = this.customerRepository
      .createQueryBuilder('customer')

      // Load assigned user relation
      .leftJoinAndSelect('customer.assignedToUser', 'assignedToUser')

      // Multi-tenancy enforcement
      .where('customer.organizationId = :organizationId', {
        organizationId: currentUser.organizationId,
      });

    // Soft delete filtering (optional)
    if (!includeDeleted) {
      query.andWhere('customer.deletedAt IS NULL');
    }

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

    // Include deleted records if requested
    if (includeDeleted) {
      query.withDeleted();
    }

    const [customers, total] = await query.getManyAndCount();

    return {
      data: customers,
      total,
      page,
      limit,
    };
  }

  // GET SINGLE CUSTOMER
  async findOne(id: string, currentUser: any) {
    const customer = await this.customerRepository.findOne({
      where: {
        id,

        // Multi-tenancy enforcement
        organizationId: currentUser.organizationId,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  // UPDATE CUSTOMER
  async update(
    id: string,
    updateCustomerDto: UpdateCustomerDto,
    currentUser: any,
  ) {
    await this.findOne(id, currentUser);

    await this.customerRepository.update(
      {
        id,

        // Multi-tenancy enforcement
        organizationId: currentUser.organizationId,
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
  async remove(id: string, currentUser: any) {
    const customer = await this.findOne(id, currentUser);

    await this.customerRepository.softDelete({
      id,

      // Multi-tenancy enforcement
      organizationId: currentUser.organizationId,
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
  }

  // CONCURRENCY-SAFE ASSIGNMENT
  async assignCustomer(customerId: string, userId: string, currentUser: any) {
    const result = await this.dataSource.transaction(async (manager) => {
      // Lock and get all assigned customers for this user
      const assignedCustomers = await manager
        .createQueryBuilder(Customer, 'customer')
        .setLock('pessimistic_write')
        .where('customer.assignedTo = :userId', { userId })
        .andWhere('customer.deletedAt IS NULL')
        .getMany();

      // Check count after locking
      if (assignedCustomers.length >= MAX_CUSTOMERS_PER_USER) {
        throw new BadRequestException(
          `User already has maximum ${MAX_CUSTOMERS_PER_USER} active customers`,
        );
      }

      // Assign customer
      await manager.update(
        Customer,
        {
          id: customerId,

          // Multi-tenancy enforcement
          organizationId: currentUser.organizationId,
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
    });

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
  async restore(id: string, currentUser: any) {
    const customer = await this.customerRepository.findOne({
      where: {
        id,

        // Multi-tenancy enforcement
        organizationId: currentUser.organizationId,
      },
      withDeleted: true,
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    if (!customer.deletedAt) {
      throw new BadRequestException('Customer is not deleted');
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

  // UNASSIGN CUSTOMER
  async unassignCustomer(customerId: string, currentUser: any) {
    const customer = await this.findOne(customerId, currentUser);

    if (!customer.assignedTo) {
      throw new BadRequestException('Customer is not assigned to anyone');
    }

    await this.customerRepository.update(
      {
        id: customerId,

        // Multi-tenancy enforcement
        organizationId: currentUser.organizationId,
      },
      {
        assignedTo: null as any,
      },
    );

    // Log activity
    await this.activityLogService.log(
      'customer_unassigned',
      'customer',
      customerId,
      currentUser.organizationId,
      currentUser.userId,
      { previouslyAssignedTo: customer.assignedTo },
    );

    return this.findOne(customerId, currentUser);
  }
}
