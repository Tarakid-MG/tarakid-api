import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import {
  Gender,
  MotherTongueLevel,
  EnglishLevel,
  KidLevel,
} from '../kid.entity';

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
