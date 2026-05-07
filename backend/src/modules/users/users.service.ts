import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { BCRYPT_SALT_ROUNDS } from '../../common/constants';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // CREATE USER (Admin only)
  async create(createUserDto: CreateUserDto, currentUser: any) {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      BCRYPT_SALT_ROUNDS,
    );

    // Create user
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      // Enforce same organization as admin
      organizationId: currentUser.organizationId,
      role: createUserDto.role || 'member',
    });

    await this.userRepository.save(user);

    // Return user without password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }

  // GET ALL USERS
  async findAll(currentUser: any) {
    const users = await this.userRepository.find({
      where: {
        // Multi-tenancy enforcement
        organizationId: currentUser.organizationId,
      },
      select: [
        'id',
        'name',
        'email',
        'role',
        'organizationId',
        'createdAt',
        'updatedAt',
      ],
    });

    return users;
  }

  // GET SINGLE USER
  async findOne(id: string, currentUser: any) {
    const user = await this.userRepository.findOne({
      where: {
        id,
        // Multi-tenancy enforcement
        organizationId: currentUser.organizationId,
      },
      select: [
        'id',
        'name',
        'email',
        'role',
        'organizationId',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // UPDATE USER
  async update(id: string, updateUserDto: UpdateUserDto, currentUser: any) {
    await this.findOne(id, currentUser);

    const updateData: any = { ...updateUserDto };

    // If password is being updated, hash it
    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(
        updateUserDto.password,
        BCRYPT_SALT_ROUNDS,
      );
    }

    await this.userRepository.update(
      {
        id,
        // Multi-tenancy enforcement
        organizationId: currentUser.organizationId,
      },
      updateData,
    );

    return this.findOne(id, currentUser);
  }

  // DELETE USER
  async remove(id: string, currentUser: any) {
    await this.findOne(id, currentUser);

    return await this.userRepository.delete({
      id,
      // Multi-tenancy enforcement
      organizationId: currentUser.organizationId,
    });
  }
}
