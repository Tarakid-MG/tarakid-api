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
import { FreeTrialSession } from './free-trial-session.entity';
import { Kid } from '../../kids/kid.entity';
import { Lesson } from '../../lessons/entities/lesson.entity';

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  REPORTED = 'REPORTED',
  COMPLETED = 'COMPLETED',
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

  @Column({ type: 'int', nullable: true })
  teacherId: number | null;

  @ManyToOne(() => Lesson, { nullable: true })
  @JoinColumn({ name: 'lessonId' })
  lesson: Lesson;

  @Column({ nullable: true })
  lessonId: string;

  @Column({ default: false })
  isKidWaiting: boolean;

  @Column({ default: false })
  isKidAccepted: boolean;

  @Column({ default: false })
  isTeacherInClass: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'text', nullable: true })
  interactionData: string;
}
