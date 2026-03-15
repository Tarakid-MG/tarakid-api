import {
  IsEnum,
  IsInt,
  IsString,
  IsArray,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import {
  Gender,
  EnglishLevel,
  MotherTongueLevel,
  KidLevel,
} from '../kid.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreateKidDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  childName: string;

  @ApiProperty()
  @IsInt()
  age: number;

  @ApiProperty({ enum: Gender })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ enum: MotherTongueLevel })
  @IsEnum(MotherTongueLevel)
  motherTongueSpeakingLevel: MotherTongueLevel;

  @ApiProperty({ enum: MotherTongueLevel })
  @IsEnum(MotherTongueLevel)
  motherTongueReadingLevel: MotherTongueLevel;

  @ApiProperty({ enum: EnglishLevel })
  @IsEnum(EnglishLevel)
  englishReadingLevel: EnglishLevel;

  @ApiProperty({ enum: EnglishLevel })
  @IsEnum(EnglishLevel)
  englishSpeakingLevel: EnglishLevel;

  @ApiProperty()
  @IsString()
  learningDuration: string;

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  hobbies: string[];

  @ApiProperty({ enum: KidLevel })
  @IsEnum(KidLevel)
  @IsOptional()
  level?: KidLevel;
}
