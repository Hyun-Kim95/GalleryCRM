import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntityHistory, HistoryEntityType } from '../entities/entity-history.entity';

@Injectable()
export class EntityHistoryService {
  constructor(
    @InjectRepository(EntityHistory)
    private entityHistoryRepository: Repository<EntityHistory>,
  ) {}

  async trackChanges(
    entityType: HistoryEntityType,
    entityId: string,
    oldValues: any,
    newValues: any,
    changedById: string,
  ): Promise<void> {
    const changes: Promise<EntityHistory>[] = [];

    for (const key in newValues) {
      // 시스템 필드 제외
      if (['id', 'createdAt', 'updatedAt', 'createdById', 'teamId'].includes(key)) {
        continue;
      }

      const oldValue = oldValues[key];
      const newValue = newValues[key];

      // 값이 변경된 경우만 기록
      if (oldValue !== newValue) {
        const history = this.entityHistoryRepository.create({
          entityType,
          entityId,
          fieldName: key,
          oldValue: oldValue !== null && oldValue !== undefined ? String(oldValue) : null,
          newValue: newValue !== null && newValue !== undefined ? String(newValue) : null,
          changedById,
        });
        changes.push(this.entityHistoryRepository.save(history));
      }
    }

    await Promise.all(changes);
  }

  async findByEntity(
    entityType: HistoryEntityType,
    entityId: string,
  ): Promise<EntityHistory[]> {
    return this.entityHistoryRepository.find({
      where: { entityType, entityId },
      relations: ['changedBy'],
      order: { createdAt: 'DESC' },
    });
  }
}


