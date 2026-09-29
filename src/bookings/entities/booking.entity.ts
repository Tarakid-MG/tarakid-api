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
import { Subscription } from '../../subscriptions/entities/subscription.entity';
import { RecurrencePattern } from '../interfaces/recurrence-pattern.interface';
import { Lesson } from '../../lessons/entities/lesson.entity';

export enum BookingStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  MISSED = 'MISSED',
  ABSENT = 'ABSENT',
  REPORTED = 'REPORTED',
  DONE_BUT_MISSING = 'DONE_BUT_MISSING',
}

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Subscription, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subscriptionId' })
  subscription: Subscription;

  @Column()
  subscriptionId: string;

  @ManyToOne(() => Kid, (kid) => kid.bookings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'kidId' })
  kid: Kid;

  @Column()
  kidId: string;

  @ManyToOne(() => User, (user) => user.regularBookings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @Column({ type: 'date' })
  sessionDate: Date;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column()
  dayOfWeek: number; // 0-6 (Sunday-Saturday)

  @Column({ default: false })
  isRecurring: boolean;

  @Column({ type: 'json', nullable: true })
  recurrencePattern: RecurrencePattern; // Stores pattern like { type: 'weekly', interval: 1, daysOfWeek: [1, 3] }

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.SCHEDULED,
  })
  status: BookingStatus;

  @Column({ type: 'int', nullable: true })
  teacherId: number | null; // For future teacher assignment

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
