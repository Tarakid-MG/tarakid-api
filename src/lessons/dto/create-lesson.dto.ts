import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsArray,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LessonType } from '../enums/lesson-type.enum';

export class CreateLessonDto {
  @ApiProperty({ example: 'Introduction to Colors' })
  @IsString()
  title: string;

  @ApiProperty({
    enum: LessonType,
    example: LessonType.GENIALLY,
    required: false,
  })
  @IsEnum(LessonType)
  @IsOptional()
  type?: LessonType;

  @ApiProperty({ example: 'https://example.com/content' })
  @IsString()
  content: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  order: number;

  @ApiProperty({ example: 'uuid-of-unit' })
  @IsUUID()
  unitId: string;

  @ApiProperty({ example: 'https://minio/thumb.png', required: false })
  @IsString()
  @IsOptional()
  thumbnailUrl?: string;
}

export class CreateLessonsBulkDto {
  @ApiProperty({ type: [CreateLessonDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLessonDto)
  lessons: CreateLessonDto[];
}
