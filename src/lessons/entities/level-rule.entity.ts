import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { EnglishLevel } from '../../kids/enums/english-level.enum';
import { KidLevel } from '../../kids/enums/kid-level.enum';

@Entity('level_rules')
export class LevelRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  minAge: number;

  @Column({ nullable: true })
  maxAge: number;

  @Column('simple-array', { nullable: true })
  englishReadingLevels: EnglishLevel[];

  @Column('simple-array', { nullable: true })
  englishSpeakingLevels: EnglishLevel[];

  @Column({ type: 'varchar', length: 10, default: 'AND' })
  operator: 'AND' | 'OR';

  @Column({ type: 'enum', enum: KidLevel })
  targetLevelCode: KidLevel;

  @Column({ default: 0 })
  priority: number;
}
