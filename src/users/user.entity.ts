import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserRole } from './enums/user-role.enum';
import { ClientAccountType } from './enums/client-account-type.enum';
import { Exclude } from 'class-transformer';
import { Kid } from '../kids/kid.entity';
import { FreeTrialBooking } from '../free-trial/entities/free-trial-booking.entity';
import type { Subscription } from '../subscriptions/entities/subscription.entity';
import type { Booking } from '../bookings/entities/booking.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true, nullable: true })
  googleId?: string;

  @Exclude()
  @Column({ nullable: true })
  password?: string;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @Column({ type: 'enum', enum: ClientAccountType, nullable: true })
  accountType?: ClientAccountType;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  verificationToken?: string;

  @Column({ nullable: true })
  resetPasswordToken?: string;

  @Column({ type: 'timestamp', nullable: true })
  resetPasswordExpires?: Date;

  @Column({ nullable: true })
  subscriptionPlan?: string;

  @Column({ default: 0 })
  credits: number;

  @OneToMany(() => Kid, (kid) => kid.user)
  kids: Kid[];

  @OneToMany(() => FreeTrialBooking, (booking) => booking.user)
  bookings: FreeTrialBooking[];

  @OneToMany('Subscription', 'user')
  subscriptions: Subscription[];

  @OneToMany('Booking', 'user')
  regularBookings: Booking[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
