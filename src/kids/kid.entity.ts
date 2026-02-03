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
import { User } from '../users/user.entity';
import type { Subscription } from '../subscriptions/entities/subscription.entity';
import type { Booking } from '../bookings/entities/booking.entity';

export enum Gender {
  BOY = 'BOY',
  GIRL = 'GIRL',
  OTHER = 'OTHER',
}

export enum EnglishLevel {
  NONE = 'NONE',
  WORDS = 'WORDS',
  SENTENCES = 'SENTENCES',
  FLUENT = 'FLUENT',
}

export enum MotherTongueLevel {
  NONE = 'NONE',
  SOME = 'SOME',
  FLUENT = 'FLUENT',
}

@Entity('kids')
export class Kid {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  age: number;

  @Column({ type: 'enum', enum: Gender })
  gender: Gender;

  @Column({ type: 'enum', enum: MotherTongueLevel })
  motherTongueProficiency: MotherTongueLevel;

  @Column({ type: 'enum', enum: EnglishLevel })
  englishReadingLevel: EnglishLevel;

  @Column({ type: 'enum', enum: EnglishLevel })
  englishSpeakingLevel: EnglishLevel;

  @Column()
  learningDuration: string;

  @Column('simple-array')
  hobbies: string[];

  @ManyToOne(() => User, (user) => user.kids, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @OneToMany('Subscription', 'kid')
  subscriptions: Subscription[];

  @OneToMany('Booking', 'kid')
  bookings: Booking[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
