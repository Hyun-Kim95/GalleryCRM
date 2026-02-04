import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction, AuditEntityType } from '../entities/audit-log.entity';

export interface CreateAuditLogDto {
  userId: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  oldValue?: Record<string, any> | null;
  newValue?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async create(dto: CreateAuditLogDto): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create(dto);
    return this.auditLogRepository.save(auditLog);
  }

  async findAll(
    userId?: string,
    entityType?: AuditEntityType,
    entityId?: string,
    limit: number = 100,
  ): Promise<AuditLog[]> {
    const query = this.auditLogRepository.createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user')
      .orderBy('log.createdAt', 'DESC')
      .limit(limit);

    if (userId) {
      query.andWhere('log.userId = :userId', { userId });
    }
    if (entityType) {
      query.andWhere('log.entityType = :entityType', { entityType });
    }
    if (entityId) {
      query.andWhere('log.entityId = :entityId', { entityId });
    }

    return query.getMany();
  }

  async findByEntity(
    entityType: AuditEntityType,
    entityId: string,
  ): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { entityType, entityId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }
}



