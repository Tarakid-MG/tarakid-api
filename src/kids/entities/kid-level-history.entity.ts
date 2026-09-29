import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Kid } from '../kid.entity';
import { User } from '../../users/user.entity';
import { KidLevel } from '../enums/kid-level.enum';

@Entity('kid_level_history')
export class KidLevelHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  kidId: string;

  @ManyToOne(() => Kid, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'kidId' })
  kid: Kid;

  @Column()
  performerId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'performerId' })
  performer: User;

  @Column({ type: 'enum', enum: KidLevel })
  oldLevel: KidLevel;

  @Column({ type: 'enum', enum: KidLevel })
  newLevel: KidLevel;

  @Column({ type: 'text' })
  reason: string;

  @CreateDateColumn()
  createdAt: Date;
}
