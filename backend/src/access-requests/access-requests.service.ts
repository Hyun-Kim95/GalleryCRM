import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { AccessRequest, AccessRequestStatus } from '../entities/access-request.entity';
import { User, UserRole } from '../entities/user.entity';
import { CreateAccessRequestDto } from './dto/create-access-request.dto';
import { ApproveAccessRequestDto } from './dto/approve-access-request.dto';
import { AuditLogService } from '../audit-logs/audit-logs.service';
import { AuditAction, AuditEntityType } from '../entities/audit-log.entity';

@Injectable()
export class AccessRequestsService {
  constructor(
    @InjectRepository(AccessRequest)
    private accessRequestRepository: Repository<AccessRequest>,
    private auditLogService: AuditLogService,
  ) {}

  async create(
    createDto: CreateAccessRequestDto,
    requester: User,
  ): Promise<AccessRequest> {
    // 이미 승인된 요청이 있고 아직 유효한지 확인
    const existingRequest = await this.accessRequestRepository.findOne({
      where: {
        requesterId: requester.id,
        targetType: createDto.targetType,
        targetId: createDto.targetId,
        status: AccessRequestStatus.APPROVED,
        expiresAt: MoreThan(new Date()),
      },
    });

    if (existingRequest) {
      throw new BadRequestException('이미 승인된 열람 요청이 유효합니다.');
    }

    const accessRequest = this.accessRequestRepository.create({
      ...createDto,
      requesterId: requester.id,
      status: AccessRequestStatus.PENDING,
    });

    const saved = await this.accessRequestRepository.save(accessRequest);

    // Audit Log
    await this.auditLogService.create({
      userId: requester.id,
      action: AuditAction.ACCESS_REQUEST,
      entityType:
        createDto.targetType === 'CUSTOMER'
          ? AuditEntityType.CUSTOMER
          : AuditEntityType.TRANSACTION,
      entityId: createDto.targetId,
      newValue: { reason: createDto.reason },
    });

    return saved;
  }

  async findAll(requester: User): Promise<AccessRequest[]> {
    // 관리자는 모든 요청 조회 가능, 그 외는 본인 요청만
    if (requester.role === UserRole.ADMIN || requester.role === UserRole.MASTER) {
      return this.accessRequestRepository.find({
        relations: ['requester', 'approvedBy'],
        order: { createdAt: 'DESC' },
      });
    }

    return this.accessRequestRepository.find({
      where: { requesterId: requester.id },
      relations: ['requester', 'approvedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, user: User): Promise<AccessRequest> {
    const request = await this.accessRequestRepository.findOne({
      where: { id },
      relations: ['requester', 'approvedBy'],
    });

    if (!request) {
      throw new NotFoundException('Access request not found');
    }

    // 권한 확인: 관리자 또는 요청자 본인만 조회 가능
    if (
      user.role !== UserRole.ADMIN &&
      user.role !== UserRole.MASTER &&
      request.requesterId !== user.id
    ) {
      throw new ForbiddenException('Access denied');
    }

    return request;
  }

  async approve(
    id: string,
    approveDto: ApproveAccessRequestDto,
    approver: User,
  ): Promise<AccessRequest> {
    // 관리자만 승인 가능
    if (approver.role !== UserRole.ADMIN && approver.role !== UserRole.MASTER) {
      throw new ForbiddenException('Only admins can approve access requests');
    }

    const request = await this.accessRequestRepository.findOne({
      where: { id },
      relations: ['requester'],
    });

    if (!request) {
      throw new NotFoundException('Access request not found');
    }

    if (request.status !== AccessRequestStatus.PENDING) {
      throw new BadRequestException('Request is not in pending status');
    }

    if (approveDto.status === AccessRequestStatus.APPROVED) {
      // 승인 시 열람 허용 기간 설정 (기본 24시간)
      const durationHours = approveDto.accessDurationHours || 24;
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + durationHours);

      request.status = AccessRequestStatus.APPROVED;
      request.approvedById = approver.id;
      request.approvedAt = new Date();
      request.expiresAt = expiresAt;
    } else if (approveDto.status === AccessRequestStatus.REJECTED) {
      if (!approveDto.rejectionReason) {
        throw new BadRequestException('Rejection reason is required');
      }
      request.status = AccessRequestStatus.REJECTED;
      request.approvedById = approver.id;
      request.approvedAt = new Date();
      request.rejectionReason = approveDto.rejectionReason;
    }

    const saved = await this.accessRequestRepository.save(request);

    // Audit Log
    await this.auditLogService.create({
      userId: approver.id,
      action:
        approveDto.status === AccessRequestStatus.APPROVED
          ? AuditAction.APPROVE
          : AuditAction.REJECT,
      entityType:
        request.targetType === 'CUSTOMER'
          ? AuditEntityType.CUSTOMER
          : AuditEntityType.TRANSACTION,
      entityId: request.targetId,
      newValue: {
        status: approveDto.status,
        expiresAt: saved.expiresAt,
        rejectionReason: approveDto.rejectionReason,
      },
    });

    return saved;
  }

  /**
   * 열람 권한 확인
   * 승인된 요청이 있고 아직 유효한지 확인
   */
  async checkAccessPermission(
    targetType: string,
    targetId: string,
    userId: string,
  ): Promise<boolean> {
    const request = await this.accessRequestRepository.findOne({
      where: {
        requesterId: userId,
        targetType: targetType as any,
        targetId,
        status: AccessRequestStatus.APPROVED,
        expiresAt: MoreThan(new Date()),
      },
    });

    return !!request;
  }
}

