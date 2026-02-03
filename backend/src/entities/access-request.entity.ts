import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum AccessRequestTargetType {
  CUSTOMER = 'CUSTOMER',
  TRANSACTION = 'TRANSACTION',
}

export enum AccessRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity('access_requests')
export class AccessRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'requester_id' })
  requesterId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'requester_id' })
  requester: User;

  @Column({
    name: 'target_type',
    type: 'enum',
    enum: AccessRequestTargetType,
  })
  targetType: AccessRequestTargetType;

  @Column({ name: 'target_id' })
  targetId: string;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({
    type: 'enum',
    enum: AccessRequestStatus,
    default: AccessRequestStatus.PENDING,
  })
  status: AccessRequestStatus;

  @Column({ name: 'approved_by', nullable: true })
  approvedById: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approvedBy: User | null;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date | null;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}


