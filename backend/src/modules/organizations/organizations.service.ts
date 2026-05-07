import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Organization } from './entities/organization.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
  ) {}

  // CREATE ORGANIZATION
  async create(createOrganizationDto: CreateOrganizationDto) {
    const organization = this.organizationRepository.create(
      createOrganizationDto,
    );
    return await this.organizationRepository.save(organization);
  }

  // GET ALL ORGANIZATIONS
  async findAll() {
    return await this.organizationRepository.find();
  }

  // GET SINGLE ORGANIZATION
  async findOne(id: string) {
    const organization = await this.organizationRepository.findOne({
      where: { id },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  // UPDATE ORGANIZATION
  async update(id: string, updateOrganizationDto: UpdateOrganizationDto) {
    await this.findOne(id);

    await this.organizationRepository.update(id, updateOrganizationDto);

    return this.findOne(id);
  }

  // DELETE ORGANIZATION
  async remove(id: string) {
    await this.findOne(id);

    return await this.organizationRepository.delete(id);
  }
}
