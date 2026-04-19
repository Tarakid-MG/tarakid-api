import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum NotificationType {
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  BOOKING_REPORTED = 'BOOKING_REPORTED',
  BOOKING_ASSIGNED = 'BOOKING_ASSIGNED',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: number; // Receiver

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column({ default: false })
  isRead: boolean;

  @Column({ type: 'json', nullable: true })
  metadata: any; // e.g., { bookingId: '...', bookingType: '...' }

  @CreateDateColumn()
  createdAt: Date;
}
