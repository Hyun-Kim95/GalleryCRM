import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Customer, CustomerStatus } from './entities/customer.entity';
import { AccessRequest, AccessRequestStatus } from './entities/access-request.entity';
import { Artist, ArtistStatus } from './entities/artist.entity';
import { AuditLog } from './entities/audit-log.entity';
import { User, UserRole } from './entities/user.entity';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(AccessRequest)
    private accessRequestRepository: Repository<AccessRequest>,
    @InjectRepository(Artist)
    private artistRepository: Repository<Artist>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getDashboardStats(user: User) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 고객 통계 (권한에 따라 필터링)
    let customerQuery = this.customerRepository.createQueryBuilder('customer');
    if (user.role === UserRole.STAFF || user.role === UserRole.MANAGER) {
      customerQuery = customerQuery.where('customer.teamId = :teamId', { teamId: user.teamId });
    }
    // ADMIN과 MASTER는 모든 데이터 접근 가능

    const totalCustomers = await customerQuery.getCount();
    
    const pendingCustomersQuery = customerQuery.clone();
    const pendingCustomers = await pendingCustomersQuery
      .andWhere('customer.status = :status', { status: CustomerStatus.PENDING })
      .getCount();

    // 열람 요청 통계
    let accessRequestQuery = this.accessRequestRepository.createQueryBuilder('ar');
    if (user.role === UserRole.STAFF || user.role === UserRole.MANAGER) {
      // STAFF와 MANAGER는 자신의 요청 또는 자신의 팀 관련 요청만
      accessRequestQuery = accessRequestQuery
        .leftJoin('ar.requester', 'requester')
        .where('ar.requesterId = :userId OR requester.teamId = :teamId', {
          userId: user.id,
          teamId: user.teamId,
        });
    }

    const pendingAccessRequests = await accessRequestQuery
      .andWhere('ar.status = :status', { status: AccessRequestStatus.PENDING })
      .getCount();

    // 최근 작가 등록 (최근 7일)
    const recentArtists = await this.artistRepository
      .createQueryBuilder('artist')
      .where('artist.createdAt >= :date', { date: sevenDaysAgo })
      .andWhere('artist.status = :status', { status: ArtistStatus.APPROVED })
      .getCount();

    // 최근 활동 기록 (최근 10개)
    let auditLogQuery = this.auditLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user')
      .orderBy('log.createdAt', 'DESC')
      .limit(10);

    if (user.role === UserRole.STAFF) {
      // STAFF는 본인 활동만
      auditLogQuery = auditLogQuery.where('log.userId = :userId', { userId: user.id });
    } else if (user.role === UserRole.MANAGER) {
      // MANAGER는 팀 활동만
      auditLogQuery = auditLogQuery
        .leftJoin('user.team', 'team')
        .where('team.id = :teamId', { teamId: user.teamId });
    }
    // ADMIN과 MASTER는 모든 활동

    const recentActivities = await auditLogQuery.getMany();

    return {
      totalCustomers,
      pendingCustomers,
      pendingAccessRequests,
      recentArtists,
      recentActivities: recentActivities.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        userName: log.user?.name || 'Unknown',
        createdAt: log.createdAt,
      })),
    };
  }
}
