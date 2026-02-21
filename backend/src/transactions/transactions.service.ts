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
import { Customer, CustomerStatus } from '../entities/customer.entity';
import { Artist, ArtistStatus } from '../entities/artist.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
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
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Artist)
    private artistRepository: Repository<Artist>,
    private auditLogService: AuditLogService,
    private entityHistoryService: EntityHistoryService,
    private accessRequestsService: AccessRequestsService,
  ) {}

  async create(createDto: CreateTransactionDto, user: User): Promise<Transaction> {
    // 관리자(ADMIN/MASTER)는 팀이 없어도 거래 생성 가능
    // 일반 사용자는 팀이 필요
    if (!user.teamId && user.role !== UserRole.ADMIN && user.role !== UserRole.MASTER) {
      throw new BadRequestException('User must belong to a team to create transactions');
    }

    // 관리자(ADMIN/MASTER)는 팀이 없어도 거래 생성 가능 - 고객의 팀을 사용
    let teamId = user.teamId;
    if (!teamId && (user.role === UserRole.ADMIN || user.role === UserRole.MASTER)) {
      // 관리자가 팀이 없으면 고객의 팀을 사용
      const customer = await this.customerRepository.findOne({
        where: { id: createDto.customerId },
      });
      if (customer?.teamId) {
        teamId = customer.teamId;
      } else {
        throw new BadRequestException('Customer must belong to a team to create transactions');
      }
    }

    const transaction = this.transactionRepository.create({
      customerId: createDto.customerId,
      artistId: createDto.artistId,
      amount: createDto.amount,
      currency: createDto.currency || 'KRW',
      contractTerms: createDto.contractTerms || null,
      transactionDate: new Date(createDto.transactionDate),
      teamId: teamId!,
      createdById: user.id,
      status: TransactionStatus.DRAFT,
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
      relations: ['customer', 'artist'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.status !== TransactionStatus.DRAFT) {
      throw new BadRequestException('Only draft transactions can be submitted');
    }

    // 고객과 작가가 모두 승인 상태여야 함
    if (transaction.customer.status !== CustomerStatus.APPROVED) {
      throw new BadRequestException('Customer must be approved before submitting transaction');
    }

    if (transaction.artist.status !== ArtistStatus.APPROVED) {
      throw new BadRequestException('Artist must be approved before submitting transaction');
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

  async update(id: string, updateDto: UpdateTransactionDto, user: User): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['customer', 'artist'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // 권한 확인: 작성자 또는 관리자만 수정 가능
    if (
      transaction.createdById !== user.id &&
      user.role !== UserRole.ADMIN &&
      user.role !== UserRole.MASTER
    ) {
      throw new ForbiddenException('Cannot update this transaction');
    }

    // DRAFT나 REJECTED 상태일 때만 수정 가능
    if (
      transaction.status !== TransactionStatus.DRAFT &&
      transaction.status !== TransactionStatus.REJECTED
    ) {
      throw new BadRequestException('Only draft or rejected transactions can be updated');
    }

    const oldValues = { ...transaction };

    // 고객 변경 시 팀 확인
    if (updateDto.customerId && updateDto.customerId !== transaction.customerId) {
      const customer = await this.customerRepository.findOne({
        where: { id: updateDto.customerId },
      });
      if (!customer) {
        throw new NotFoundException('Customer not found');
      }
      // 관리자가 아니면 같은 팀의 고객만 선택 가능
      if (
        user.role !== UserRole.ADMIN &&
        user.role !== UserRole.MASTER &&
        customer.teamId !== user.teamId
      ) {
        throw new ForbiddenException('Cannot select customer from different team');
      }
      transaction.customerId = updateDto.customerId;
      // 고객이 변경되면 팀도 변경
      if (customer.teamId) {
        transaction.teamId = customer.teamId;
      }
    }

    // 작가 변경 확인
    if (updateDto.artistId && updateDto.artistId !== transaction.artistId) {
      const artist = await this.artistRepository.findOne({
        where: { id: updateDto.artistId },
      });
      if (!artist) {
        throw new NotFoundException('Artist not found');
      }
      transaction.artistId = updateDto.artistId;
    }

    // 금액, 통화, 계약 조건, 거래일 업데이트
    if (updateDto.amount !== undefined) {
      transaction.amount = updateDto.amount;
    }
    if (updateDto.currency !== undefined) {
      transaction.currency = updateDto.currency;
    }
    if (updateDto.contractTerms !== undefined) {
      transaction.contractTerms = updateDto.contractTerms || null;
    }
    if (updateDto.transactionDate !== undefined) {
      transaction.transactionDate = new Date(updateDto.transactionDate);
    }

    // REJECTED 상태에서 수정하면 DRAFT로 변경
    if (transaction.status === TransactionStatus.REJECTED) {
      transaction.status = TransactionStatus.DRAFT;
      transaction.approvedById = null;
      transaction.approvedAt = null;
      transaction.rejectionReason = null;
    }

    const saved = await this.transactionRepository.save(transaction);

    // Audit Log
    await this.auditLogService.create({
      userId: user.id,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.TRANSACTION,
      entityId: id,
      oldValue: oldValues,
      newValue: saved,
    });

    return saved;
  }

  async approve(id: string, approveDto: { status: TransactionStatus.APPROVED | TransactionStatus.REJECTED; rejectionReason?: string }, user: User): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.status !== TransactionStatus.PENDING) {
      throw new BadRequestException('Only pending transactions can be approved or rejected');
    }

    const oldValues = { ...transaction };
    transaction.status = approveDto.status;
    
    if (approveDto.status === TransactionStatus.APPROVED) {
      transaction.approvedById = user.id;
      transaction.approvedAt = new Date();
      transaction.rejectionReason = null;
    } else {
      transaction.approvedById = user.id;
      transaction.approvedAt = new Date();
      transaction.rejectionReason = approveDto.rejectionReason || null;
    }

    const saved = await this.transactionRepository.save(transaction);

    await this.auditLogService.create({
      userId: user.id,
      action: approveDto.status === TransactionStatus.APPROVED ? AuditAction.APPROVE : AuditAction.REJECT,
      entityType: AuditEntityType.TRANSACTION,
      entityId: id,
      oldValue: oldValues,
      newValue: saved,
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

