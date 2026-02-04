import { IsOptional, IsString, IsEnum, IsDateString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerStatus } from '../../entities/customer.entity';
import { Type } from 'class-transformer';

export class SearchCustomerDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({ enum: CustomerStatus })
  @IsEnum(CustomerStatus)
  @IsOptional()
  status?: CustomerStatus;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  teamId?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;
}



