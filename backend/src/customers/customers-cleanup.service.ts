import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Customer } from '../entities/customer.entity';

@Injectable()
export class CustomersCleanupService {
  private readonly logger = new Logger(CustomersCleanupService.name);

  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  /**
   * 매일 새벽 3시에 소프트 삭제 후 1년이 지난 고객을 물리적으로 삭제
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async hardDeleteOldSoftDeletedCustomers() {
    const now = new Date();
    const cutoff = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); // 1년 전

    const result = await this.customerRepository.delete({
      isDeleted: true,
      deletedAt: LessThan(cutoff),
    });

    if (result.affected && result.affected > 0) {
      this.logger.log(`Hard deleted ${result.affected} soft-deleted customers (before ${cutoff.toISOString()})`);
    }
  }
}


