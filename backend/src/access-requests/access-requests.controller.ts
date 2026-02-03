import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AccessRequestsService } from './access-requests.service';
import { CreateAccessRequestDto } from './dto/create-access-request.dto';
import { ApproveAccessRequestDto } from './dto/approve-access-request.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { User, UserRole } from '../entities/user.entity';
import { UseMasking } from '../common/decorators/masking.decorator';

@ApiTags('access-requests')
@Controller('access-requests')
@ApiBearerAuth()
@UseMasking()
export class AccessRequestsController {
  constructor(private readonly accessRequestsService: AccessRequestsService) {}

  @Post()
  @ApiOperation({ summary: 'Create access request' })
  async create(
    @Body() createDto: CreateAccessRequestDto,
    @CurrentUser() user: User,
  ) {
    return this.accessRequestsService.create(createDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all access requests' })
  async findAll(@CurrentUser() user: User) {
    return this.accessRequestsService.findAll(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get access request by id' })
  async findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.accessRequestsService.findOne(id, user);
  }

  @Patch(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MASTER)
  @Permissions('APPROVE_ACCESS_REQUEST')
  @ApiOperation({ summary: 'Approve or reject access request (Admin/Master only)' })
  async approve(
    @Param('id') id: string,
    @Body() approveDto: ApproveAccessRequestDto,
    @CurrentUser() user: User,
  ) {
    return this.accessRequestsService.approve(id, approveDto, user);
  }
}

