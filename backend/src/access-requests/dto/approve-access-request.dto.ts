import { IsEnum, IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AccessRequestStatus } from '../../entities/access-request.entity';

export class ApproveAccessRequestDto {
  @ApiProperty({ enum: AccessRequestStatus })
  @IsEnum(AccessRequestStatus)
  status: AccessRequestStatus;

  @ApiProperty({ required: false, description: '열람 허용 기간 (시간 단위)' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  accessDurationHours?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  rejectionReason?: string;
}




