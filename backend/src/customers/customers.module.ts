import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { CustomersCleanupService } from './customers-cleanup.service';
import { Customer } from '../entities/customer.entity';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { EntityHistoryModule } from '../entity-history/entity-history.module';
import { AccessRequestsModule } from '../access-requests/access-requests.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer]),
    AuditLogsModule,
    EntityHistoryModule,
    AccessRequestsModule,
  ],
  controllers: [CustomersController],
  providers: [CustomersService, CustomersCleanupService],
  exports: [CustomersService],
})
export class CustomersModule {}

