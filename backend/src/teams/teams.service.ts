import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from '../entities/team.entity';
import { User, UserRole } from '../entities/user.entity';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private teamRepository: Repository<Team>,
  ) {}

  private ensureCanManageTeams(user: User) {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.MASTER) {
      throw new ForbiddenException('팀 생성/수정 권한이 없습니다.');
    }
  }

  async create(createDto: CreateTeamDto, user: User): Promise<Team> {
    this.ensureCanManageTeams(user);

    const exists = await this.teamRepository.findOne({
      where: { name: createDto.name },
    });
    if (exists) {
      throw new BadRequestException('이미 존재하는 팀 이름입니다.');
    }

    const team = this.teamRepository.create({
      name: createDto.name,
      description: createDto.description || null,
      isActive: createDto.isActive ?? true,
    });

    return this.teamRepository.save(team);
  }

  async findAll(user: User): Promise<Team[]> {
    let teams: Team[];

    // 관리자/마스터는 모든 팀 조회 가능
    if (user.role === UserRole.ADMIN || user.role === UserRole.MASTER) {
      teams = await this.teamRepository.find({
        where: { isActive: true },
        relations: ['users'],
        order: { name: 'ASC' },
      });
    } else {
      // 팀장/팀원은 본인 팀만 조회
      if (!user.teamId) {
        return [];
      }

      teams = await this.teamRepository.find({
        where: { id: user.teamId, isActive: true },
        relations: ['users'],
        order: { name: 'ASC' },
      });
    }

    // 팀원 목록에서 MASTER 역할 사용자 제외
    teams.forEach((team) => {
      if (team.users) {
        team.users = team.users.filter((u) => u.role !== UserRole.MASTER);
      }
    });

    return teams;
  }

  async findOne(id: string, user: User): Promise<Team> {
    const team = await this.teamRepository.findOne({
      where: { id },
      relations: ['users'],
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    // 권한 체크: 관리자/마스터는 모든 팀 조회 가능, 그 외는 본인 팀만
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.MASTER) {
      if (team.id !== user.teamId) {
        throw new ForbiddenException('You can only view your own team');
      }
    }

    // 팀원 목록에서 MASTER 역할 사용자 제외
    if (team.users) {
      team.users = team.users.filter((u) => u.role !== UserRole.MASTER);
      
      // 역할별로 정렬 (MANAGER 먼저, 그 다음 STAFF, ADMIN)
      team.users.sort((a, b) => {
        const roleOrder = { [UserRole.MANAGER]: 1, [UserRole.STAFF]: 2, [UserRole.ADMIN]: 3 };
        return (roleOrder[a.role] || 99) - (roleOrder[b.role] || 99);
      });
    }

    return team;
  }

  async update(id: string, updateDto: UpdateTeamDto, user: User): Promise<Team> {
    this.ensureCanManageTeams(user);

    const team = await this.teamRepository.findOne({
      where: { id },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    if (updateDto.name && updateDto.name !== team.name) {
      const exists = await this.teamRepository.findOne({
        where: { name: updateDto.name },
      });
      if (exists) {
        throw new BadRequestException('이미 존재하는 팀 이름입니다.');
      }
    }

    Object.assign(team, {
      ...updateDto,
      description: updateDto.description ?? team.description,
      isActive:
        typeof updateDto.isActive === 'boolean' ? updateDto.isActive : team.isActive,
    });

    return this.teamRepository.save(team);
  }
}

