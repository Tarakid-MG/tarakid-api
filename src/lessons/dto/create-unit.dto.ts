import { IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUnitDto {
  @ApiProperty({ example: 'Unit 1: Greetings' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'level-uuid-1' })
  @IsString()
  levelId: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  order: number;
}
