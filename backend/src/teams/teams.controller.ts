import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TeamsService } from './teams.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../entities/user.entity';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

@ApiTags('teams')
@Controller('teams')
@ApiBearerAuth()
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MASTER)
  @ApiOperation({ summary: 'Create team (ADMIN/MASTER only)' })
  async create(@Body() createDto: CreateTeamDto, @CurrentUser() user: User) {
    return this.teamsService.create(createDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get teams (filtered by user role)' })
  async findAll(@CurrentUser() user: User) {
    return this.teamsService.findAll(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get team by id with members' })
  async findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.teamsService.findOne(id, user);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MASTER)
  @ApiOperation({ summary: 'Update team (ADMIN/MASTER only)' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateTeamDto,
    @CurrentUser() user: User,
  ) {
    return this.teamsService.update(id, updateDto, user);
  }
}

