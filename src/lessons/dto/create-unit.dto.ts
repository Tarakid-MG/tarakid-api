import { IsString, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { KidLevel } from '../../kids/kid.entity';

export class CreateUnitDto {
  @ApiProperty({ example: 'Unit 1: Greetings' })
  @IsString()
  title: string;

  @ApiProperty({ enum: KidLevel, example: KidLevel.L1 })
  @IsEnum(KidLevel)
  level: KidLevel;

  @ApiProperty({ example: 1 })
  @IsNumber()
  order: number;
}
