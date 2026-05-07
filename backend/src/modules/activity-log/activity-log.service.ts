import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ActivityLog } from './entities/activity-log.entity';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';

@Injectable()
export class ActivityLogService {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
  ) {}

  // CREATE ACTIVITY LOG
  async create(createActivityLogDto: CreateActivityLogDto) {
    const log = this.activityLogRepository.create(createActivityLogDto);
    return await this.activityLogRepository.save(log);
  }

  // LOG ACTIVITY (Helper method)
  async log(
    action: string,
    entityType: string,
    entityId: string,
    organizationId: string,
    userId: string,
    metadata?: Record<string, any>,
  ) {
    return await this.create({
      action,
      entityType,
      entityId,
      organizationId,
      userId,
      metadata,
    });
  }

  // GET ALL ACTIVITY LOGS
  async findAll(currentUser: any, page = 1, limit = 50) {
    const query = this.activityLogRepository
      .createQueryBuilder('activity_log')
      .where('activity_log.organizationId = :organizationId', {
        organizationId: currentUser.organizationId,
      })
      .orderBy('activity_log.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [logs, total] = await query.getManyAndCount();

    return {
      data: logs,
      total,
      page,
      limit,
    };
  }

  // GET ACTIVITY LOGS BY ENTITY
  async findByEntity(entityType: string, entityId: string, currentUser: any) {
    return await this.activityLogRepository.find({
      where: {
        entityType,
        entityId,
        organizationId: currentUser.organizationId,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }
}
