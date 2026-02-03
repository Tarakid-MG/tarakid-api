import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { FreeTrialBooking } from './free-trial-booking.entity';

@Entity('free_trial_sessions')
export class FreeTrialSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  date: string;

  @Column({
    type: 'enum',
    enum: ['FREE_TRIAL', 'REGULAR'],
    default: 'FREE_TRIAL',
  })
  type: 'FREE_TRIAL' | 'REGULAR';

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column({ default: 5 })
  capacity: number;

  @Column({ default: 0 })
  bookedSlots: number;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => FreeTrialBooking, (booking) => booking.session)
  bookings: FreeTrialBooking[];
}
