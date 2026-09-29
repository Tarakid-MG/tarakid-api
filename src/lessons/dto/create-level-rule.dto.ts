import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
} from 'class-validator';
import { EnglishLevel } from '../../kids/enums/english-level.enum';
import { KidLevel } from '../../kids/enums/kid-level.enum';

export class CreateLevelRuleDto {
  @ApiProperty({ example: 0, required: false })
  @IsNumber()
  @IsOptional()
  minAge?: number;

  @ApiProperty({ example: 6, required: false })
  @IsNumber()
  @IsOptional()
  maxAge?: number;

  @ApiProperty({ enum: EnglishLevel, isArray: true, required: false })
  @IsArray()
  @IsOptional()
  englishReadingLevels?: EnglishLevel[];

  @ApiProperty({ enum: EnglishLevel, isArray: true, required: false })
  @IsArray()
  @IsOptional()
  englishSpeakingLevels?: EnglishLevel[];

  @ApiProperty({ example: 'AND', enum: ['AND', 'OR'] })
  @IsString()
  operator: 'AND' | 'OR';

  @ApiProperty({ enum: KidLevel })
  @IsEnum(KidLevel)
  targetLevelCode: KidLevel;

  @ApiProperty({ example: 10 })
  @IsNumber()
  priority: number;
}
