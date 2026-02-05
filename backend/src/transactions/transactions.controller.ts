import { Controller, Get, Post, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ApproveTransactionDto } from './dto/approve-transaction.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../entities/user.entity';
import { UseMasking } from '../common/decorators/masking.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@ApiTags('transactions')
@Controller('transactions')
@ApiBearerAuth()
@UseMasking()
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create transaction' })
  async create(@Body() createDto: CreateTransactionDto, @CurrentUser() user: User) {
    return this.transactionsService.create(createDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all transactions' })
  async findAll(@CurrentUser() user: User) {
    return this.transactionsService.findAll(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by id' })
  async findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.transactionsService.findOne(id, user);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit transaction for approval' })
  async submitForApproval(@Param('id') id: string, @CurrentUser() user: User) {
    return this.transactionsService.submitForApproval(id, user);
  }

  @Patch(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.MASTER)
  @Permissions('APPROVE_CUSTOMER')
  @ApiOperation({ summary: 'Approve or reject transaction' })
  async approve(
    @Param('id') id: string,
    @Body() approveDto: ApproveTransactionDto,
    @CurrentUser() user: User,
  ) {
    return this.transactionsService.approve(id, approveDto, user);
  }
}




