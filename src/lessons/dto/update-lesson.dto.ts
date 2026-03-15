import { IsString, IsNumber, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLessonDto {
  @ApiProperty({ example: 'Introduction to Colors', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ example: 'genially', required: false })
  @IsString()
  @IsOptional()
  type?: string;

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
}
