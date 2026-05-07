import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { AssignCustomerDto } from './dto/assign-customer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('customers')
@ApiBearerAuth('JWT-auth')
@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({ status: 201, description: 'Customer created successfully' })
  create(
    @Body() createCustomerDto: CreateCustomerDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.customersService.create(createCustomerDto, currentUser);
  }

  @Get()
  @ApiOperation({ summary: 'Get all customers with pagination and search' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'includeDeleted', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Customers retrieved successfully' })
  findAll(
    @CurrentUser() currentUser: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    return this.customersService.findAll(
      currentUser,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      search,
      includeDeleted === 'true',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single customer by ID' })
  @ApiResponse({ status: 200, description: 'Customer found' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  findOne(@Param('id') id: string, @CurrentUser() currentUser: any) {
    return this.customersService.findOne(id, currentUser);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a customer' })
  @ApiResponse({ status: 200, description: 'Customer updated successfully' })
  update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.customersService.update(id, updateCustomerDto, currentUser);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a customer' })
  @ApiResponse({ status: 200, description: 'Customer soft deleted successfully' })
  remove(@Param('id') id: string, @CurrentUser() currentUser: any) {
    return this.customersService.remove(id, currentUser);
  }

  @Post(':id/assign')
  @ApiOperation({ summary: 'Assign customer to a user (max 5 per user)' })
  @ApiResponse({ status: 200, description: 'Customer assigned successfully' })
  @ApiResponse({ status: 400, description: 'User already has 5 customers' })
  assignCustomer(
    @Param('id') id: string,
    @Body() assignCustomerDto: AssignCustomerDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.customersService.assignCustomer(
      id,
      assignCustomerDto.userId,
      currentUser,
    );
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted customer' })
  @ApiResponse({ status: 200, description: 'Customer restored successfully' })
  restore(@Param('id') id: string, @CurrentUser() currentUser: any) {
    return this.customersService.restore(id, currentUser);
  }

  @Post(':id/unassign')
  @ApiOperation({ summary: 'Unassign customer from user' })
  @ApiResponse({ status: 200, description: 'Customer unassigned successfully' })
  unassignCustomer(@Param('id') id: string, @CurrentUser() currentUser: any) {
    return this.customersService.unassignCustomer(id, currentUser);
  }
}
