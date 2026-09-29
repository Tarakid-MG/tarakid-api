import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Unit } from './unit.entity';
import { LessonType } from '../enums/lesson-type.enum';

@Entity('lessons')
export class Lesson {
  @ApiProperty({ example: 'uuid-lesson-1' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Hello World' })
  @Column()
  title: string;

  @ApiProperty({ enum: LessonType, example: LessonType.GENIALLY })
  @Column({ type: 'enum', enum: LessonType, default: LessonType.GENIALLY })
  type: LessonType;

  @ApiProperty({ example: 'https://example.com/content' })
  @Column({ type: 'text' })
  content: string;

  @ApiProperty({ example: 0 })
  @Column()
  order: number;

  @ApiProperty({ example: 'https://minio/thumbnail.png', required: false })
  @Column({ type: 'text', nullable: true })
  thumbnailUrl?: string;

  @ManyToOne(() => Unit, (unit: Unit) => unit.lessons)
  unit: Unit;
}
