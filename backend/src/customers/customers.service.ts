import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { Customer, CustomerStatus } from '../entities/customer.entity';
import { User, UserRole } from '../entities/user.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { ApproveCustomerDto } from './dto/approve-customer.dto';
import { SearchCustomerDto } from './dto/search-customer.dto';
import { AuditLogService } from '../audit-logs/audit-logs.service';
import { AuditAction, AuditEntityType } from '../entities/audit-log.entity';
import { EntityHistoryService } from '../entity-history/entity-history.service';
import { HistoryEntityType } from '../entities/entity-history.entity';
import { AccessRequestsService } from '../access-requests/access-requests.service';
import { AccessRequestTargetType } from '../entities/access-request.entity';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    private auditLogService: AuditLogService,
    private entityHistoryService: EntityHistoryService,
    private accessRequestsService: AccessRequestsService,
  ) {}

  async create(createDto: CreateCustomerDto, user: User): Promise<Customer> {
    // 사용자의 teamId를 자동으로 설정
    if (!user.teamId) {
      throw new BadRequestException('User must belong to a team');
    }

    const customer = this.customerRepository.create({
      ...createDto,
      teamId: user.teamId,
      createdById: user.id,
      status: CustomerStatus.DRAFT,
      // createdAt은 @CreateDateColumn이 자동으로 설정
    });

    const saved = await this.customerRepository.save(customer);

    // Audit Log
    await this.auditLogService.create({
      userId: user.id,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.CUSTOMER,
      entityId: saved.id,
      newValue: { name: saved.name, email: saved.email },
    });

    return saved;
  }

  async findAll(searchDto: SearchCustomerDto, user: User) {
    const { keyword, status, teamId, startDate, endDate, page = 1, limit = 20 } = searchDto;

    const query = this.customerRepository
      .createQueryBuilder('customer')
      .where('(customer.isDeleted = :isDeleted OR customer.isDeleted IS NULL)', { isDeleted: false })
      .leftJoinAndSelect('customer.createdBy', 'createdBy')
      .leftJoinAndSelect('customer.team', 'team')
      .leftJoinAndSelect('customer.approvedBy', 'approvedBy');

    // 권한 기반 필터링
    if (user.role === UserRole.STAFF) {
      // Staff는 본인 팀 데이터만
      query.andWhere('customer.teamId = :teamId', { teamId: user.teamId });
    } else if (user.role === UserRole.MANAGER) {
      // Manager는 본인 팀 데이터만
      query.andWhere('customer.teamId = :teamId', { teamId: user.teamId });
    }
    // Admin은 모든 데이터 접근 가능

    // 검색 조건
    if (keyword) {
      query.andWhere(
        '(customer.name LIKE :keyword OR customer.email LIKE :keyword OR customer.phone LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    if (status) {
      query.andWhere('customer.status = :status', { status });
    }

    if (teamId) {
      query.andWhere('customer.teamId = :teamId', { teamId });
    }

    if (startDate && endDate) {
      query.andWhere('customer.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    // 페이지네이션
    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);
    query.orderBy('customer.createdAt', 'DESC');

    const [data, total] = await query.getManyAndCount();

    // 열람 승인된 고객에 대해서는 리스트에서도 마스킹이 풀리도록 createdById를 런타임에 교체
    const processedData = await Promise.all(
      data.map(async (customer) => {
        const hasAccess = await this.accessRequestsService.checkAccessPermission(
          AccessRequestTargetType.CUSTOMER,
          customer.id,
          user.id,
        );

        if (hasAccess) {
          (customer as any).createdById = user.id;
        }

        return customer;
      }),
    );

    return {
      data: processedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, user: User): Promise<Customer> {
    const customer = await this.customerRepository
      .createQueryBuilder('customer')
      .leftJoinAndSelect('customer.createdBy', 'createdBy')
      .leftJoinAndSelect('customer.team', 'team')
      .leftJoinAndSelect('customer.approvedBy', 'approvedBy')
      .leftJoinAndSelect('customer.transactions', 'transactions')
      .where('customer.id = :id', { id })
      .andWhere('(customer.isDeleted = :isDeleted OR customer.isDeleted IS NULL)', { isDeleted: false })
      .getOne();

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // 권한 확인
    await this.checkAccessPermission(customer, user);

    // Audit Log (조회)
    await this.auditLogService.create({
      userId: user.id,
      action: AuditAction.VIEW,
      entityType: AuditEntityType.CUSTOMER,
      entityId: id,
    });

    return customer;
  }

  async update(
    id: string,
    updateDto: UpdateCustomerDto,
    user: User,
  ): Promise<Customer> {
    const customer = await this.customerRepository
      .createQueryBuilder('customer')
      .where('customer.id = :id', { id })
      .andWhere('(customer.isDeleted = :isDeleted OR customer.isDeleted IS NULL)', { isDeleted: false })
      .getOne();

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // 권한 확인: 생성자 또는 관리자만 수정 가능
    if (
      customer.createdById !== user.id &&
      user.role !== UserRole.ADMIN &&
      user.role !== UserRole.MASTER
    ) {
      throw new ForbiddenException('Cannot update this customer');
    }

    const oldValues = { ...customer };
    Object.assign(customer, updateDto);

    // 승인된 고객을 수정하면 PENDING 상태로 변경 (재승인 필요)
    if (customer.status === CustomerStatus.APPROVED) {
      customer.status = CustomerStatus.PENDING;
      customer.approvedById = null;
      customer.approvedAt = null;
      customer.rejectionReason = null;
    }

    const saved = await this.customerRepository.save(customer);

    // 변경 이력 저장
    await this.entityHistoryService.trackChanges(
      HistoryEntityType.CUSTOMER,
      id,
      oldValues,
      saved,
      user.id,
    );

    // Audit Log
    await this.auditLogService.create({
      userId: user.id,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.CUSTOMER,
      entityId: id,
      oldValue: oldValues,
      newValue: saved,
    });

    return saved;
  }

  async submitForApproval(id: string, user: User): Promise<Customer> {
    const customer = await this.customerRepository
      .createQueryBuilder('customer')
      .where('customer.id = :id', { id })
      .andWhere('(customer.isDeleted = :isDeleted OR customer.isDeleted IS NULL)', { isDeleted: false })
      .getOne();

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // DRAFT, APPROVED, REJECTED 상태에서만 승인 요청 가능
    if (customer.status === CustomerStatus.PENDING) {
      throw new BadRequestException('Customer is already pending approval');
    }

    customer.status = CustomerStatus.PENDING;
    // 이전 승인 정보 초기화
    customer.approvedById = null;
    customer.approvedAt = null;
    customer.rejectionReason = null;

    const saved = await this.customerRepository.save(customer);

    // Audit Log
    await this.auditLogService.create({
      userId: user.id,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.CUSTOMER,
      entityId: id,
      newValue: { status: CustomerStatus.PENDING },
    });

    return saved;
  }

  async approve(
    id: string,
    approveDto: ApproveCustomerDto,
    approver: User,
  ): Promise<Customer> {
    // 관리자 또는 팀장만 승인 가능
    if (
      approver.role !== UserRole.ADMIN &&
      approver.role !== UserRole.MANAGER &&
      approver.role !== UserRole.MASTER
    ) {
      throw new ForbiddenException('Only admins and managers can approve');
    }

    const customer = await this.customerRepository
      .createQueryBuilder('customer')
      .where('customer.id = :id', { id })
      .andWhere('(customer.isDeleted = :isDeleted OR customer.isDeleted IS NULL)', { isDeleted: false })
      .getOne();

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    if (customer.status !== CustomerStatus.PENDING) {
      throw new BadRequestException('Customer is not in pending status');
    }

    if (approveDto.status === CustomerStatus.APPROVED) {
      customer.status = CustomerStatus.APPROVED;
      customer.approvedById = approver.id;
      customer.approvedAt = new Date();
    } else if (approveDto.status === CustomerStatus.REJECTED) {
      if (!approveDto.rejectionReason) {
        throw new BadRequestException('Rejection reason is required');
      }
      customer.status = CustomerStatus.REJECTED;
      customer.approvedById = approver.id;
      customer.approvedAt = new Date();
      customer.rejectionReason = approveDto.rejectionReason;
    }

    const saved = await this.customerRepository.save(customer);

    // Audit Log
    await this.auditLogService.create({
      userId: approver.id,
      action:
        approveDto.status === CustomerStatus.APPROVED
          ? AuditAction.APPROVE
          : AuditAction.REJECT,
      entityType: AuditEntityType.CUSTOMER,
      entityId: id,
      newValue: { status: approveDto.status, rejectionReason: approveDto.rejectionReason },
    });

    return saved;
  }

  /**
   * 고객 소프트 삭제 (DRAFT, PENDING, REJECTED 상태만 허용)
   */
  async softDelete(id: string, user: User): Promise<void> {
    const customer = await this.customerRepository
      .createQueryBuilder('customer')
      .where('customer.id = :id', { id })
      .andWhere('(customer.isDeleted = :isDeleted OR customer.isDeleted IS NULL)', { isDeleted: false })
      .getOne();

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // 상태 체크: APPROVED 는 삭제 불가
    if (customer.status === CustomerStatus.APPROVED) {
      throw new BadRequestException('Approved customers cannot be deleted');
    }

    // 권한 체크: 생성자이거나 ADMIN/MASTER 만 삭제 가능
    const isOwner = customer.createdById === user.id;
    const isAdminLike =
      user.role === UserRole.ADMIN || user.role === UserRole.MASTER;

    if (!isOwner && !isAdminLike) {
      throw new ForbiddenException('You are not allowed to delete this customer');
    }

    customer.isDeleted = true;
    customer.deletedAt = new Date();
    await this.customerRepository.save(customer);

    // Audit Log
    await this.auditLogService.create({
      userId: user.id,
      action: AuditAction.DELETE,
      entityType: AuditEntityType.CUSTOMER,
      entityId: id,
      oldValue: customer,
    });
  }

  private async checkAccessPermission(customer: Customer, user: User): Promise<void> {
    // 관리자는 모든 데이터 접근 가능
    if (user.role === UserRole.ADMIN || user.role === UserRole.MASTER) {
      return;
    }

    // 본인이 생성한 데이터 접근 가능
    if (customer.createdById === user.id) {
      return;
    }

    // 먼저 열람 요청 승인 여부 확인 (CUSTOMER 기준)
    const hasAccess = await this.accessRequestsService.checkAccessPermission(
      AccessRequestTargetType.CUSTOMER,
      customer.id,
      user.id,
    );

    if (hasAccess) {
      // 승인된 열람 요청이 있는 경우, 마스킹 해제를 위해 runtime 상에서 생성자로 취급
      (customer as any).createdById = user.id;
      return;
    }

    // 열람 승인은 없지만, 같은 팀 데이터인 경우 접근 허용 (마스킹 레벨은 팀 기준으로 적용)
    if (customer.teamId === user.teamId) {
      return;
    }

    // 그 외는 접근 불가 (열람 요청 필요)
    throw new ForbiddenException('Access denied. Please request access approval.');
  }
}

