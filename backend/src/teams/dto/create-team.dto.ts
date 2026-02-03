import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTeamDto {
  @ApiProperty({ description: '팀 이름' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: '팀 설명', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ description: '활성 여부', required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}



