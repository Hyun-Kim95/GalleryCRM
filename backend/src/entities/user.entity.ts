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
import { Team } from './team.entity';
import { Customer } from './customer.entity';
import { Transaction } from './transaction.entity';
import { AccessRequest } from './access-request.entity';
import { AuditLog } from './audit-log.entity';

export enum UserRole {
  MASTER = 'MASTER', // 마스터 계정 (최상위)
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STAFF,
  })
  role: UserRole;

  @Column({ name: 'team_id', nullable: true })
  teamId: string;

  @ManyToOne(() => Team, { nullable: true })
  @JoinColumn({ name: 'team_id' })
  team: Team;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Customer, (customer) => customer.createdBy)
  createdCustomers: Customer[];

  @OneToMany(() => Transaction, (transaction) => transaction.createdBy)
  createdTransactions: Transaction[];

  @OneToMany(() => AccessRequest, (request) => request.requester)
  accessRequests: AccessRequest[];

  @OneToMany(() => AuditLog, (log) => log.user)
  auditLogs: AuditLog[];
}

