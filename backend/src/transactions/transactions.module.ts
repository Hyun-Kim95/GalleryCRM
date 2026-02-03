import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { Transaction } from '../entities/transaction.entity';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { EntityHistoryModule } from '../entity-history/entity-history.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction]),
    AuditLogsModule,
    EntityHistoryModule,
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}


