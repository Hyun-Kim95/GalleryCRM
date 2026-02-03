import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { ApproveCustomerDto } from './dto/approve-customer.dto';
import { SearchCustomerDto } from './dto/search-customer.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { User, UserRole } from '../entities/user.entity';
import { UseMasking } from '../common/decorators/masking.decorator';

@ApiTags('customers')
@Controller('customers')
@ApiBearerAuth()
@UseMasking()
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @ApiOperation({ summary: 'Create customer (Draft status)' })
  async create(
    @Body() createDto: CreateCustomerDto,
    @CurrentUser() user: User,
  ) {
    return this.customersService.create(createDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Search customers' })
  async findAll(@Query() searchDto: SearchCustomerDto, @CurrentUser() user: User) {
    return this.customersService.findAll(searchDto, user);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit customer for approval' })
  async submitForApproval(@Param('id') id: string, @CurrentUser() user: User) {
    return this.customersService.submitForApproval(id, user);
  }

  @Patch(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.MASTER)
  @Permissions('APPROVE_CUSTOMER')
  @ApiOperation({ summary: 'Approve or reject customer' })
  async approve(
    @Param('id') id: string,
    @Body() approveDto: ApproveCustomerDto,
    @CurrentUser() user: User,
  ) {
    return this.customersService.approve(id, approveDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete customer (DRAFT/PENDING/REJECTED only)' })
  async softDelete(@Param('id') id: string, @CurrentUser() user: User) {
    await this.customersService.softDelete(id, user);
    return { success: true };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer by id' })
  async findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.customersService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update customer' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCustomerDto,
    @CurrentUser() user: User,
  ) {
    return this.customersService.update(id, updateDto, user);
  }
}

