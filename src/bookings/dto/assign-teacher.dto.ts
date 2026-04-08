import { IsEnum, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignTeacherDto {
  @ApiProperty({
    example: 'REGULAR',
    enum: ['REGULAR', 'FREE_TRIAL'],
    description: 'The type of booking',
  })
  @IsEnum(['REGULAR', 'FREE_TRIAL'])
  type: 'REGULAR' | 'FREE_TRIAL';

  @ApiProperty({
    example: 123,
    description: 'The ID of the teacher to assign',
  })
  @IsNumber()
  teacherId: number;
}
