import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Kid } from '../../kids/kid.entity';

export enum CommitmentType {
  MONTHLY = 'MONTHLY',
  THREE_MONTHS = 'THREE_MONTHS',
  SIX_MONTHS = 'SIX_MONTHS',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
}

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.subscriptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @ManyToOne(() => Kid, (kid) => kid.subscriptions, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'kidId' })
  kid: Kid;

  @Column({ nullable: true })
  kidId: string;

  @Column()
  planName: string;

  @Column()
  frequency: number; // Classes per week (1, 2, or 3)

  @Column({ type: 'enum', enum: CommitmentType })
  commitmentType: CommitmentType;

  @Column()
  creditsPerMonth: number;

  @Column()
  totalCredits: number;

  @Column()
  remainingCredits: number;

  @Column()
  pricePerMonth: number;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.PENDING_PAYMENT,
  })
  status: SubscriptionStatus;

  @Column({ nullable: true })
  stripeSessionId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
