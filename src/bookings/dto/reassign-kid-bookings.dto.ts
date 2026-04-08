import { IsNumber, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReassignKidBookingsDto {
  @ApiProperty({
    example: 123,
    description: 'The ID of the teacher to assign',
  })
  @IsNumber()
  teacherId: number;

  @ApiProperty({
    example: false,
    default: false,
    description:
      'Whether to include passed or cancelled bookings in the reassignment',
  })
  @IsBoolean()
  @IsOptional()
  includeHistory?: boolean;
}
