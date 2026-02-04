import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RbacService } from '../rbac/rbac.service';
import { UserRole } from '../entities/user.entity';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

class UpdateRolePermissionsDto {
  permissionKeys: string[];
}

@ApiTags('admin-roles')
@ApiBearerAuth()
@Controller('admin/roles')
export class AdminRolesController {
  constructor(private readonly rbacService: RbacService) {}

  @Get('permissions')
  @ApiOperation({ summary: '모든 Permission 목록 조회 (MASTER 전용)' })
  @Roles(UserRole.MASTER)
  @Permissions('MANAGE_PERMISSIONS')
  async getAllPermissions() {
    return this.rbacService.getAllPermissions();
  }

  @Get(':role/permissions')
  @ApiOperation({ summary: '특정 역할의 Permission 목록 조회 (MASTER 전용)' })
  @Roles(UserRole.MASTER)
  @Permissions('MANAGE_PERMISSIONS')
  async getPermissionsByRole(@Param('role') role: UserRole) {
    return this.rbacService.getPermissionsByRole(role);
  }

  @Patch(':role/permissions')
  @ApiOperation({ summary: '특정 역할의 Permission 세트 설정 (MASTER 전용)' })
  @Roles(UserRole.MASTER)
  @Permissions('MANAGE_PERMISSIONS')
  async setPermissionsForRole(
    @Param('role') role: UserRole,
    @Body() body: UpdateRolePermissionsDto,
  ) {
    await this.rbacService.setPermissionsForRole(role, body.permissionKeys ?? []);
    return { success: true };
  }
}




