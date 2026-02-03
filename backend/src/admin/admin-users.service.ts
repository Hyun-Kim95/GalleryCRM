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
    // 디버깅: 현재 사용자 정보 확인
    console.log('=== findAll called ===');
    console.log('Current user:', { id: currentUser.id, email: currentUser.email, role: currentUser.role });
    
    // 먼저 현재 사용자 정보를 명시적으로 조회
    const currentUserFull = await this.userRepo.findOne({
      where: { id: currentUser.id },
      relations: ['team'],
    });
    console.log('Current user from DB:', currentUserFull ? { id: currentUserFull.id, email: currentUserFull.email, role: currentUserFull.role } : 'NOT FOUND');
    
    // 단순하게 find 메서드 사용하여 모든 ADMIN, MANAGER, STAFF 조회
    const allUsers = await this.userRepo.find({
      where: { role: Not(UserRole.MASTER) },
      relations: ['team'],
      order: { createdAt: 'DESC' },
    });
    
    console.log('Query result count:', allUsers.length);
    console.log('Query result roles:', allUsers.map(u => ({ id: u.id, email: u.email, role: u.role })));
    
    // ADMIN/MASTER 본인이 목록에 없으면 명시적으로 추가
    const currentUserInList = allUsers.find(u => u.id === currentUser.id);
    console.log('Current user in list:', currentUserInList ? 'YES' : 'NO');
    
    // ADMIN 또는 MASTER 본인을 목록에 추가 (MASTER는 조회에서 제외되므로)
    if (!currentUserInList && currentUserFull) {
      // MASTER는 조회에서 제외되지만, 본인 정보는 볼 수 있어야 함
      if (currentUserFull.role === UserRole.MASTER || currentUserFull.role === UserRole.ADMIN) {
        console.log('Adding current user to list:', currentUserFull.email, currentUserFull.role);
        return [currentUserFull, ...allUsers]; // 맨 앞에 추가
      }
    }
    
    return allUsers;
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

  async update(id: string, dto: UpdateAdminUserDto, currentUser?: User): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // ADMIN은 본인 정보만 수정 가능 (역할 변경 불가)
    if (currentUser && currentUser.role === UserRole.ADMIN && currentUser.id === id) {
      // ADMIN이 본인 정보 수정 시 역할 변경 불가
      if (dto.role && dto.role !== user.role) {
        throw new ForbiddenException('본인의 역할은 변경할 수 없습니다.');
      }
      // ADMIN이 본인 정보 수정 시 활성화 상태 변경 불가
      if (dto.isActive !== undefined && dto.isActive !== user.isActive) {
        throw new ForbiddenException('본인의 활성화 상태는 변경할 수 없습니다.');
      }
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


