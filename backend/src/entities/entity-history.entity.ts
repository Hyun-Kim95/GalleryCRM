import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Customer } from './customer.entity';
import { Transaction } from './transaction.entity';

export enum HistoryEntityType {
  CUSTOMER = 'CUSTOMER',
  TRANSACTION = 'TRANSACTION',
}

@Entity('entity_histories')
@Index(['entityType', 'entityId'])
export class EntityHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'entity_type',
    type: 'enum',
    enum: HistoryEntityType,
  })
  entityType: HistoryEntityType;

  @Column({ name: 'entity_id' })
  entityId: string;

  @Column({ name: 'field_name' })
  fieldName: string;

  @Column({ name: 'old_value', type: 'text', nullable: true })
  oldValue: string | null;

  @Column({ name: 'new_value', type: 'text', nullable: true })
  newValue: string | null;

  @Column({ name: 'changed_by' })
  changedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'changed_by' })
  changedBy: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Polymorphic relations (optional, for type safety)
  @ManyToOne(() => Customer, { nullable: true, createForeignKeyConstraints: false })
  customer: Customer | null;

  @ManyToOne(() => Transaction, { nullable: true, createForeignKeyConstraints: false })
  transaction: Transaction | null;
}




