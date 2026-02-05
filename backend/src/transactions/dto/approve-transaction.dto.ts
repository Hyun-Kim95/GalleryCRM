import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TransactionStatus } from '../../entities/transaction.entity';

export class ApproveTransactionDto {
  @ApiProperty({ enum: TransactionStatus })
  @IsEnum(TransactionStatus)
  status: TransactionStatus.APPROVED | TransactionStatus.REJECTED;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  rejectionReason?: string;
}

