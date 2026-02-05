import { IsEnum, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AccessRequestTargetType } from '../../entities/access-request.entity';

export class CreateAccessRequestDto {
  @ApiProperty({ enum: AccessRequestTargetType })
  @IsEnum(AccessRequestTargetType)
  @IsNotEmpty()
  targetType: AccessRequestTargetType;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  targetId: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  reason?: string;
}




