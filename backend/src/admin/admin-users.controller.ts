import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminUsersService } from './admin-users.service';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { User, UserRole } from '../entities/user.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('admin-users')
@ApiBearerAuth()
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MASTER, UserRole.MANAGER)
  @Permissions('MANAGE_USERS')
  @ApiOperation({ summary: '사용자 목록 조회' })
  async findAll(@CurrentUser() user: User) {
    return this.adminUsersService.findAll(user);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MASTER, UserRole.MANAGER)
  @Permissions('MANAGE_USERS')
  @ApiOperation({ summary: '사용자 생성' })
  async create(@Body() dto: CreateAdminUserDto, @CurrentUser() user: User) {
    return this.adminUsersService.create(dto, user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MASTER)
  @Permissions('MANAGE_USERS')
  @ApiOperation({ summary: '사용자 정보 수정(역할/팀/활성화)' })
  async update(@Param('id') id: string, @Body() dto: UpdateAdminUserDto) {
    return this.adminUsersService.update(id, dto);
  }

  @Patch(':id/reset-password')
  @Roles(UserRole.ADMIN, UserRole.MASTER)
  @Permissions('MANAGE_USERS')
  @ApiOperation({ summary: '사용자 비밀번호 초기화' })
  async resetPassword(@Param('id') id: string, @Body() dto: ResetPasswordDto) {
    await this.adminUsersService.resetPassword(id, dto);
    return { success: true };
  }
}


