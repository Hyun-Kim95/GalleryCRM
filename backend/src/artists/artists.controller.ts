import { Body, Controller, Get, Param, Post, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ArtistsService } from './artists.service';
import { CreateArtistDto } from './dto/create-artist.dto';
import { UpdateArtistDto } from './dto/update-artist.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../entities/user.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { ApproveArtistDto } from './dto/approve-artist.dto';

@ApiTags('artists')
@Controller('artists')
@ApiBearerAuth()
export class ArtistsController {
  constructor(private readonly artistsService: ArtistsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MASTER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Create artist (all roles allowed)' })
  async create(@Body() dto: CreateArtistDto, @CurrentUser() user: User) {
    return this.artistsService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all active artists' })
  async findAll() {
    return this.artistsService.findAll();
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get pending artists for approval' })
  async findPending() {
    return this.artistsService.findPending();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get artist by id' })
  async findOne(@Param('id') id: string) {
    return this.artistsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update artist' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateArtistDto,
    @CurrentUser() user: User,
  ) {
    return this.artistsService.update(id, updateDto, user);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit artist for approval' })
  async submitForApproval(@Param('id') id: string, @CurrentUser() user: User) {
    return this.artistsService.submitForApproval(id, user);
  }

  @Patch(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.MASTER)
  @ApiOperation({ summary: 'Approve or reject artist (Admin/Manager/Master only)' })
  async approve(
    @Param('id') id: string,
    @Body() approveDto: ApproveArtistDto,
    @CurrentUser() user: User,
  ) {
    return this.artistsService.approve(id, approveDto, user);
  }
}


