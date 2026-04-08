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
import { Level } from '../lessons/entities/level.entity';

import { Gender } from './enums/kid-gender.enum';
import { EnglishLevel } from './enums/english-level.enum';
import { MotherTongueLevel } from './enums/mother-tongue-level.enum';
import { KidLevel } from './enums/kid-level.enum';

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
  motherTongueSpeakingLevel: MotherTongueLevel;

  @Column({ type: 'enum', enum: MotherTongueLevel })
  motherTongueReadingLevel: MotherTongueLevel;

  @Column({ type: 'enum', enum: EnglishLevel })
  englishReadingLevel: EnglishLevel;

  @Column({ type: 'enum', enum: EnglishLevel })
  englishSpeakingLevel: EnglishLevel;

  @Column({
    type: 'enum',
    enum: KidLevel,
    default: KidLevel.L0,
    nullable: true,
  })
  level: KidLevel;

  @ManyToOne(() => Level, { nullable: true })
  @JoinColumn({ name: 'levelId' })
  levelEntity: Level;

  @Column({ nullable: true })
  levelId: string;

  @Column()
  learningDuration: string;

  @Column('simple-array')
  hobbies: string[];

  @Column({ type: 'text', nullable: true })
  avatarUrl?: string;

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
