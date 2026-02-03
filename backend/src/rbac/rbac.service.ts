import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../entities/permission.entity';
import { RolePermission } from '../entities/role-permission.entity';
import { User, UserRole } from '../entities/user.entity';

@Injectable()
export class RbacService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
  ) {}

  /**
   * 사용자에게 특정 permission key가 있는지 검사
   * MASTER는 항상 true
   */
  async userHasPermission(user: User, permissionKey: string): Promise<boolean> {
    if (!user) return false;

    // MASTER는 모든 권한 허용
    if (user.role === UserRole.MASTER) {
      return true;
    }

    const exists = await this.rolePermissionRepository
      .createQueryBuilder('rp')
      .innerJoin('rp.permission', 'p')
      .where('rp.role = :role', { role: user.role })
      .andWhere('p.key = :key', { key: permissionKey })
      .getExists();

    return exists;
  }

  /**
   * 모든 Permission 조회
   */
  async getAllPermissions(): Promise<Permission[]> {
    return this.permissionRepository.find({
      order: { key: 'ASC' },
    });
  }

  /**
   * 특정 역할에 대한 Permission 목록 조회
   */
  async getPermissionsByRole(role: UserRole): Promise<Permission[]> {
    const rolePermissions = await this.rolePermissionRepository.find({
      where: { role },
      relations: ['permission'],
    });
    return rolePermissions.map((rp) => rp.permission);
  }

  /**
   * 특정 역할의 Permission 세트 교체
   */
  async setPermissionsForRole(role: UserRole, permissionKeys: string[]): Promise<void> {
    const permissions = await this.permissionRepository.findBy({
      key: permissionKeys.length ? permissionKeys : ['__never__'],
    } as any);

    await this.rolePermissionRepository.delete({ role });

    const rolePermissions = permissions.map((p) =>
      this.rolePermissionRepository.create({
        role,
        permissionId: p.id,
      }),
    );

    if (rolePermissions.length > 0) {
      await this.rolePermissionRepository.save(rolePermissions);
    }
  }
}



