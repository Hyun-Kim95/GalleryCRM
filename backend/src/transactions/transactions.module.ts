import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { Transaction } from '../entities/transaction.entity';
import { Customer } from '../entities/customer.entity';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { EntityHistoryModule } from '../entity-history/entity-history.module';
import { AccessRequestsModule } from '../access-requests/access-requests.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, Customer]),
    AuditLogsModule,
    EntityHistoryModule,
    AccessRequestsModule,
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}


