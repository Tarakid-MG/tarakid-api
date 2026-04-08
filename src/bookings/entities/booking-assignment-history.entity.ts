import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum BookingTypeEnum {
  REGULAR = 'REGULAR',
  FREE_TRIAL = 'FREE_TRIAL',
}

@Entity('booking_assignment_history')
export class BookingAssignmentHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  bookingId: string; // Storing as string since Regular is UUID and Free Trial is Int

  @Column({ type: 'enum', enum: BookingTypeEnum })
  bookingType: BookingTypeEnum;

  @Column({ type: 'int', nullable: true })
  previousTeacherId: number | null;

  @Column({ type: 'varchar', nullable: true })
  previousTeacherName: string | null;

  @Column({ type: 'int', nullable: true })
  newTeacherId: number | null;

  @Column({ type: 'varchar', nullable: true })
  newTeacherName: string | null;

  @Column()
  assignedById: number;

  @Column()
  assignedByRole: string;

  @Column()
  assignedByName: string;

  @CreateDateColumn()
  createdAt: Date;
}
