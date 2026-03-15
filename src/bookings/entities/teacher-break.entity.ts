import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';

@Entity('teacher_breaks')
export class TeacherBreak {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacherId' })
  teacher: User;

  @Column()
  teacherId: number;

  /** Start of the break period (inclusive) – YYYY-MM-DD */
  @Column({ type: 'date' })
  startDate: string;

  /** End of the break period (inclusive) – YYYY-MM-DD */
  @Column({ type: 'date' })
  endDate: string;

  /** Optional human-readable reason */
  @Column({ nullable: true })
  reason: string;

  @CreateDateColumn()
  createdAt: Date;
}
