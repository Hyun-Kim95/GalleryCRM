import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { UseMasking } from '../common/decorators/masking.decorator';

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
}


