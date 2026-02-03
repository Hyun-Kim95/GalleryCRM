import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditLogService } from './audit-logs.service';
import { AuditEntityType } from '../entities/audit-log.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';

@ApiTags('audit-logs')
@Controller('audit-logs')
@ApiBearerAuth()
export class AuditLogsController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @ApiOperation({ summary: 'Get audit logs' })
  async findAll(
    @CurrentUser() user: User,
    @Query('userId') userId?: string,
    @Query('entityType') entityType?: AuditEntityType,
    @Query('entityId') entityId?: string,
    @Query('limit') limit?: string,
  ) {
    // 일반 사용자는 본인 로그만 조회 가능
    const targetUserId = user.role === 'ADMIN' || user.role === 'MASTER' ? userId : user.id;
    
    return this.auditLogService.findAll(
      targetUserId,
      entityType,
      entityId,
      limit ? parseInt(limit, 10) : 100,
    );
  }
}

