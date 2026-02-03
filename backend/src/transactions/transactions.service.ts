import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionStatus } from '../entities/transaction.entity';
import { User, UserRole } from '../entities/user.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { AuditLogService } from '../audit-logs/audit-logs.service';
import { AuditAction, AuditEntityType } from '../entities/audit-log.entity';
import { EntityHistoryService } from '../entity-history/entity-history.service';
import { AccessRequestsService } from '../access-requests/access-requests.service';
import { AccessRequestTargetType } from '../entities/access-request.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private auditLogService: AuditLogService,
    private entityHistoryService: EntityHistoryService,
    private accessRequestsService: AccessRequestsService,
  ) {}

  async create(createDto: CreateTransactionDto, user: User): Promise<Transaction> {
    const transaction = this.transactionRepository.create({
      ...createDto,
      teamId: user.teamId,
      createdById: user.id,
      status: TransactionStatus.DRAFT,
      transactionDate: new Date(createDto.transactionDate),
    });

    const saved = await this.transactionRepository.save(transaction);

    await this.auditLogService.create({
      userId: user.id,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.TRANSACTION,
      entityId: saved.id,
      newValue: { amount: saved.amount, customerId: saved.customerId },
    });

    return saved;
  }

  async findAll(user: User) {
    const query = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.customer', 'customer')
      .leftJoinAndSelect('transaction.artist', 'artist')
      .leftJoinAndSelect('transaction.createdBy', 'createdBy')
      .leftJoinAndSelect('transaction.team', 'team');

    if (user.role === UserRole.STAFF || user.role === UserRole.MANAGER) {
      query.andWhere('transaction.teamId = :teamId', { teamId: user.teamId });
    }

    query.orderBy('transaction.createdAt', 'DESC');

    const data = await query.getMany();

    // 열람 승인된 거래에 대해서는 리스트에서도 마스킹이 풀리도록 createdById를 런타임에 교체
    const processedData = await Promise.all(
      data.map(async (transaction) => {
        const hasAccess = await this.accessRequestsService.checkAccessPermission(
          AccessRequestTargetType.TRANSACTION,
          transaction.id,
          user.id,
        );

        if (hasAccess) {
          (transaction as any).createdById = user.id;
        }

        return transaction;
      }),
    );

    return processedData;
  }

  async findOne(id: string, user: User): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['customer', 'artist', 'createdBy', 'team', 'approvedBy'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    await this.checkAccessPermission(transaction, user);

    await this.auditLogService.create({
      userId: user.id,
      action: AuditAction.VIEW,
      entityType: AuditEntityType.TRANSACTION,
      entityId: id,
    });

    return transaction;
  }

  async submitForApproval(id: string, user: User): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.status !== TransactionStatus.DRAFT) {
      throw new BadRequestException('Only draft transactions can be submitted');
    }

    transaction.status = TransactionStatus.PENDING;
    const saved = await this.transactionRepository.save(transaction);

    await this.auditLogService.create({
      userId: user.id,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.TRANSACTION,
      entityId: id,
      newValue: { status: TransactionStatus.PENDING },
    });

    return saved;
  }

  private async checkAccessPermission(
    transaction: Transaction,
    user: User,
  ): Promise<void> {
    if (user.role === UserRole.ADMIN || user.role === UserRole.MASTER) {
      return;
    }

    if (transaction.createdById === user.id) {
      return;
    }

    const hasAccess = await this.accessRequestsService.checkAccessPermission(
      AccessRequestTargetType.TRANSACTION,
      transaction.id,
      user.id,
    );

    if (hasAccess) {
      (transaction as any).createdById = user.id;
      return;
    }

    if (transaction.teamId === user.teamId) {
      return;
    }

    throw new ForbiddenException('Access denied. Please request access approval.');
  }
}

