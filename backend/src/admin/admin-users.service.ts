import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../entities/user.entity';
import { Team } from '../entities/team.entity';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Team)
    private readonly teamRepo: Repository<Team>,
  ) {}

  async findAll(currentUser: User): Promise<User[]> {
    // MASTER는 여전히 목록에서 제외
    if (currentUser.role === UserRole.MANAGER) {
      // 팀장은 자신의 팀원만 조회
      if (!currentUser.teamId) {
        return [];
      }
      return this.userRepo.find({
        where: { teamId: currentUser.teamId, role: Not(UserRole.MASTER) },
        relations: ['team'],
        order: { createdAt: 'DESC' },
      });
    }

    // ADMIN / MASTER는 전체 (MASTER 제외)
    return this.userRepo.find({
      where: { role: Not(UserRole.MASTER) },
      relations: ['team'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(dto: CreateAdminUserDto, currentUser: User): Promise<User> {
    // 팀장은 자신의 팀에만, 그리고 STAFF만 생성 가능
    if (currentUser.role === UserRole.MANAGER) {
      if (!currentUser.teamId) {
        throw new BadRequestException('팀 정보가 없습니다. 관리자에게 문의하세요.');
      }
      if (dto.role !== UserRole.STAFF) {
        throw new ForbiddenException('팀장은 사원(STAFF) 계정만 생성할 수 있습니다.');
      }
      dto.teamId = currentUser.teamId;
    }

    const exists = await this.userRepo.findOne({ where: { email: dto.email } });
    if (exists) {
      throw new BadRequestException('이미 존재하는 이메일입니다.');
    }

    if (dto.role === UserRole.MASTER) {
      throw new BadRequestException('MASTER 계정은 여기서 생성할 수 없습니다.');
    }

    if (dto.teamId) {
      const team = await this.teamRepo.findOne({ where: { id: dto.teamId } });
      if (!team) {
        throw new BadRequestException('팀 정보를 찾을 수 없습니다.');
      }
    }

    const hash = await bcrypt.hash(dto.initialPassword, 10);

    const user = this.userRepo.create({
      email: dto.email,
      name: dto.name,
      role: dto.role,
      teamId: dto.teamId,
      password: hash,
      isActive: true,
    });

    return this.userRepo.save(user);
  }

  async update(id: string, dto: UpdateAdminUserDto): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    if (user.role === UserRole.MASTER && dto.role && dto.role !== UserRole.MASTER) {
      throw new BadRequestException('MASTER 역할 변경은 허용되지 않습니다.');
    }

    if (dto.teamId) {
      const team = await this.teamRepo.findOne({ where: { id: dto.teamId } });
      if (!team) {
        throw new BadRequestException('팀 정보를 찾을 수 없습니다.');
      }
    }

    Object.assign(user, dto);
    return this.userRepo.save(user);
  }

  async resetPassword(id: string, dto: ResetPasswordDto): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    user.password = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepo.save(user);
  }
}


