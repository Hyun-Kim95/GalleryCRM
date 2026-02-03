import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ArtistStatus } from '../../entities/artist.entity';

export class ApproveArtistDto {
  @ApiProperty({ enum: ArtistStatus })
  @IsEnum(ArtistStatus)
  status: ArtistStatus;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  rejectionReason?: string;
}


