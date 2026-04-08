import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { Gender } from '../enums/kid-gender.enum';
import { MotherTongueLevel } from '../enums/mother-tongue-level.enum';
import { EnglishLevel } from '../enums/english-level.enum';
import { KidLevel } from '../enums/kid-level.enum';

export class UpdateKidDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  age?: number;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsString()
  gender?: Gender;

  @ApiPropertyOptional({ enum: MotherTongueLevel })
  @IsOptional()
  @IsString()
  motherTongueSpeakingLevel?: MotherTongueLevel;

  @ApiPropertyOptional({ enum: MotherTongueLevel })
  @IsOptional()
  @IsString()
  motherTongueReadingLevel?: MotherTongueLevel;

  @ApiPropertyOptional({ enum: EnglishLevel })
  @IsOptional()
  @IsString()
  englishReadingLevel?: EnglishLevel;

  @ApiPropertyOptional({ enum: EnglishLevel })
  @IsOptional()
  @IsString()
  englishSpeakingLevel?: EnglishLevel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  learningDuration?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  hobbies?: string[];

  @ApiPropertyOptional({ enum: KidLevel })
  @IsOptional()
  @IsEnum(KidLevel)
  level?: KidLevel;
}
