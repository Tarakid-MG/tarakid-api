import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Unit } from './unit.entity';

@Entity('levels')
export class Level {
  @ApiProperty({ example: 'uuid-1' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Junior' })
  @Column()
  name: string;

  @ApiProperty({ example: 'L1' })
  @Column({ unique: true })
  code: string;

  @ApiProperty({ example: 1 })
  @Column({ default: 0 })
  order: number;

  @ApiProperty({ type: () => [Unit] })
  @OneToMany(() => Unit, (unit) => unit.levelEntity)
  units: Unit[];
}
