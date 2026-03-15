import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLessonDto {
  @ApiProperty({ example: 'Introduction to Colors' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'genially', required: false })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({ example: 'https://example.com/content' })
  @IsString()
  content: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  order: number;

  @ApiProperty({ example: 'uuid-of-unit' })
  @IsUUID()
  unitId: string;
}

export class CreateLessonsBulkDto {
  @ApiProperty({ type: [CreateLessonDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLessonDto)
  lessons: CreateLessonDto[];
}
