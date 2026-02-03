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

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private auditLogService: AuditLogService,
    private entityHistoryService: EntityHistoryService,
  ) {}

  async create(createDto: CreateTransactionDto, user: User): Promise<Transaction> {
    if (
      user.teamId !== createDto.teamId &&
      user.role !== UserRole.ADMIN &&
      user.role !== UserRole.MASTER
    ) {
      throw new ForbiddenException('Cannot create transaction for other team');
    }

    const transaction = this.transactionRepository.create({
      ...createDto,
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
    const query = this.transactionRepository.createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.customer', 'customer')
      .leftJoinAndSelect('transaction.artist', 'artist')
      .leftJoinAndSelect('transaction.createdBy', 'createdBy')
      .leftJoinAndSelect('transaction.team', 'team');

    if (user.role === UserRole.STAFF || user.role === UserRole.MANAGER) {
      query.andWhere('transaction.teamId = :teamId', { teamId: user.teamId });
    }

    query.orderBy('transaction.createdAt', 'DESC');

    return query.getMany();
  }

  async findOne(id: string, user: User): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['customer', 'artist', 'createdBy', 'team', 'approvedBy'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    this.checkAccessPermission(transaction, user);

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

  private checkAccessPermission(transaction: Transaction, user: User): void {
    if (user.role === UserRole.ADMIN || user.role === UserRole.MASTER) {
      return;
    }

    if (transaction.createdById === user.id) {
      return;
    }

    if (transaction.teamId === user.teamId) {
      return;
    }

    throw new ForbiddenException('Access denied. Please request access approval.');
  }
}

