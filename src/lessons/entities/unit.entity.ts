import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Lesson } from './lesson.entity';
import { KidLevel } from '../../kids/kid.entity';

@Entity('units')
export class Unit {
  @ApiProperty({ example: 'uuid-1' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Unit 1: Greetings' })
  @Column()
  title: string;

  @ApiProperty({ enum: KidLevel, example: KidLevel.L1 })
  @Column({ type: 'enum', enum: KidLevel })
  level: KidLevel;

  @ApiProperty({ example: 0 })
  @Column({ default: 0 })
  order: number;

  @ApiProperty({ type: () => [Lesson] })
  @OneToMany(() => Lesson, (lesson: Lesson) => lesson.unit, { cascade: true })
  lessons: Lesson[];
}
