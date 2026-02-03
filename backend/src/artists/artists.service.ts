import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Artist, ArtistStatus } from '../entities/artist.entity';
import { CreateArtistDto } from './dto/create-artist.dto';
import { UpdateArtistDto } from './dto/update-artist.dto';
import { AuditLogService } from '../audit-logs/audit-logs.service';
import { AuditAction, AuditEntityType } from '../entities/audit-log.entity';
import { User, UserRole } from '../entities/user.entity';
import { ApproveArtistDto } from './dto/approve-artist.dto';

@Injectable()
export class ArtistsService {
  constructor(
    @InjectRepository(Artist)
    private artistRepository: Repository<Artist>,
    private auditLogService: AuditLogService,
  ) {}

  async create(dto: CreateArtistDto, user: User): Promise<Artist> {
    const artist = this.artistRepository.create({
      name: dto.name,
      nationality: dto.nationality,
      genre: dto.genre,
      bio: dto.bio,
      isActive: dto.isActive ?? true,
      status: ArtistStatus.DRAFT,
      createdById: user.id,
    });

    const saved = await this.artistRepository.save(artist);

    await this.auditLogService.create({
      userId: user.id,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.ARTIST,
      entityId: saved.id,
      newValue: { name: saved.name },
    });

    return saved;
  }

  async findAll(): Promise<Artist[]> {
    return this.artistRepository.find({
      order: { name: 'ASC' },
      relations: ['createdBy', 'approvedBy'],
    });
  }

  async findPending(): Promise<Artist[]> {
    return this.artistRepository.find({
      where: { status: ArtistStatus.PENDING },
      relations: ['createdBy', 'approvedBy'],
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Artist> {
    const artist = await this.artistRepository.findOne({
      where: { id },
      relations: ['createdBy', 'approvedBy'],
    });

    if (!artist) {
      throw new NotFoundException('Artist not found');
    }

    return artist;
  }

  async update(id: string, updateDto: UpdateArtistDto, user: User): Promise<Artist> {
    const artist = await this.artistRepository.findOne({ where: { id } });

    if (!artist) {
      throw new NotFoundException('Artist not found');
    }

    // 권한 확인: 생성자 또는 관리자만 수정 가능
    if (
      artist.createdById !== user.id &&
      user.role !== UserRole.ADMIN &&
      user.role !== UserRole.MASTER &&
      user.role !== UserRole.MANAGER
    ) {
      throw new ForbiddenException('Cannot update this artist');
    }

    const oldValues = { ...artist };
    Object.assign(artist, updateDto);

    // 승인된 작가를 수정하면 PENDING 상태로 변경 (재승인 필요)
    if (artist.status === ArtistStatus.APPROVED) {
      artist.status = ArtistStatus.PENDING;
      artist.approvedById = null;
      artist.approvedAt = null;
      artist.rejectionReason = null;
    }

    const saved = await this.artistRepository.save(artist);

    // Audit Log
    await this.auditLogService.create({
      userId: user.id,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.ARTIST,
      entityId: id,
      oldValue: oldValues,
      newValue: saved,
    });

    return saved;
  }

  async submitForApproval(id: string, user: User): Promise<Artist> {
    const artist = await this.artistRepository.findOne({ where: { id } });

    if (!artist) {
      throw new NotFoundException('Artist not found');
    }

    if (artist.status === ArtistStatus.PENDING) {
      throw new BadRequestException('Artist is already pending approval');
    }

    artist.status = ArtistStatus.PENDING;
    artist.approvedById = null;
    artist.approvedAt = null;
    artist.rejectionReason = null;

    const saved = await this.artistRepository.save(artist);

    await this.auditLogService.create({
      userId: user.id,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.ARTIST,
      entityId: id,
      newValue: { status: ArtistStatus.PENDING },
    });

    return saved;
  }

  async approve(
    id: string,
    approveDto: ApproveArtistDto,
    approver: User,
  ): Promise<Artist> {
    if (
      approver.role !== UserRole.ADMIN &&
      approver.role !== UserRole.MANAGER &&
      approver.role !== UserRole.MASTER
    ) {
      throw new ForbiddenException('Only admins and managers can approve artists');
    }

    const artist = await this.artistRepository.findOne({ where: { id } });

    if (!artist) {
      throw new NotFoundException('Artist not found');
    }

    if (artist.status !== ArtistStatus.PENDING) {
      throw new BadRequestException('Artist is not in pending status');
    }

    if (approveDto.status === ArtistStatus.APPROVED) {
      artist.status = ArtistStatus.APPROVED;
      artist.approvedById = approver.id;
      artist.approvedAt = new Date();
      artist.rejectionReason = null;
    } else if (approveDto.status === ArtistStatus.REJECTED) {
      if (!approveDto.rejectionReason) {
        throw new BadRequestException('Rejection reason is required');
      }
      artist.status = ArtistStatus.REJECTED;
      artist.approvedById = approver.id;
      artist.approvedAt = new Date();
      artist.rejectionReason = approveDto.rejectionReason;
    }

    const saved = await this.artistRepository.save(artist);

    await this.auditLogService.create({
      userId: approver.id,
      action:
        approveDto.status === ArtistStatus.APPROVED
          ? AuditAction.APPROVE
          : AuditAction.REJECT,
      entityType: AuditEntityType.ARTIST,
      entityId: id,
      newValue: {
        status: approveDto.status,
        rejectionReason: approveDto.rejectionReason,
      },
    });

    return saved;
  }
}


