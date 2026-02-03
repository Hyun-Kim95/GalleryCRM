import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ArtistsService } from './artists.service';

@ApiTags('artists')
@Controller('artists')
@ApiBearerAuth()
export class ArtistsController {
  constructor(private readonly artistsService: ArtistsService) {}

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


