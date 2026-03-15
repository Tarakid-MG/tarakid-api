import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Unit } from './unit.entity';

@Entity('lessons')
export class Lesson {
  @ApiProperty({ example: 'uuid-lesson-1' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Hello World' })
  @Column()
  title: string;

  @ApiProperty({ example: 'genially' })
  @Column({ default: 'genially' })
  type: string;

  @ApiProperty({ example: 'https://example.com/content' })
  @Column({ type: 'text' })
  content: string;

  @ApiProperty({ example: 0 })
  @Column()
  order: number;

  @ManyToOne(() => Unit, (unit: Unit) => unit.lessons)
  unit: Unit;
}
