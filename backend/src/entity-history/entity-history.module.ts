import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntityHistoryService } from './entity-history.service';
import { EntityHistory } from '../entities/entity-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EntityHistory])],
  providers: [EntityHistoryService],
  exports: [EntityHistoryService],
})
export class EntityHistoryModule {}


