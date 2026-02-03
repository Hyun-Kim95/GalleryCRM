import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ArtistsService } from './artists.service';
import { CreateArtistDto } from './dto/create-artist.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../entities/user.entity';

@ApiTags('artists')
@Controller('artists')
@ApiBearerAuth()
export class ArtistsController {
  constructor(private readonly artistsService: ArtistsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MASTER)
  @ApiOperation({ summary: 'Create artist (Admin/Master only)' })
  async create(@Body() dto: CreateArtistDto) {
    return this.artistsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all active artists' })
  async findAll() {
    return this.artistsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get artist by id' })
  async findOne(@Param('id') id: string) {
    return this.artistsService.findOne(id);
  }
}


