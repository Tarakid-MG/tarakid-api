import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { FreeTrialSession } from './free-trial-session.entity';
import { Kid } from '../../kids/kid.entity';

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

@Entity('free_trial_bookings')
export class FreeTrialBooking {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  user: User;

  @Column()
  userId: number;

  @ManyToOne(() => Kid)
  kid: Kid;

  @Column({ nullable: true })
  kidId: string;

  @ManyToOne(() => FreeTrialSession, (session) => session.bookings)
  session: FreeTrialSession;

  @Column()
  sessionId: number;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  @CreateDateColumn()
  createdAt: Date;
}
