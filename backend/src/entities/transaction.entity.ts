import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Customer } from './customer.entity';
import { Artist } from './artist.entity';
import { User } from './user.entity';
import { Team } from './team.entity';
import { EntityHistory } from './entity-history.entity';

export enum TransactionStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'artist_id' })
  artistId: string;

  @ManyToOne(() => Artist)
  @JoinColumn({ name: 'artist_id' })
  artist: Artist;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ default: 'KRW' })
  currency: string;

  @Column({ name: 'contract_terms', type: 'text', nullable: true })
  contractTerms: string;

  @Column({ name: 'transaction_date', type: 'date' })
  transactionDate: Date;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.DRAFT,
  })
  status: TransactionStatus;

  @Column({ name: 'created_by' })
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @Column({ name: 'team_id' })
  teamId: string;

  @ManyToOne(() => Team)
  @JoinColumn({ name: 'team_id' })
  team: Team;

  @Column({ name: 'approved_by', nullable: true })
  approvedById: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approvedBy: User | null;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date | null;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => EntityHistory, (history) => history.transaction)
  histories: EntityHistory[];
}


