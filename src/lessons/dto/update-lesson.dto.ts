import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LessonType } from '../enums/lesson-type.enum';

export class UpdateLessonDto {
  @ApiProperty({ example: 'Introduction to Colors', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    enum: LessonType,
    example: LessonType.GENIALLY,
    required: false,
  })
  @IsEnum(LessonType)
  @IsOptional()
  type?: LessonType;

  @ApiProperty({
    example: '<div class="container-wrapper-genially">...</div>',
    description: 'Genially embed code or PDF URL',
    required: false,
  })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  order?: number;

  @ApiProperty({ example: 'uuid-of-unit', required: false })
  @IsUUID()
  @IsOptional()
  unitId?: string;

  @ApiProperty({ example: 'https://minio/thumb.png', required: false })
  @IsString()
  @IsOptional()
  thumbnailUrl?: string;
}
