import { IsEnum, IsInt, IsString, IsArray, IsNotEmpty } from 'class-validator';
import { Gender, EnglishLevel, MotherTongueLevel } from '../kid.entity';
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
  motherTongueProficiency: MotherTongueLevel;

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
}
