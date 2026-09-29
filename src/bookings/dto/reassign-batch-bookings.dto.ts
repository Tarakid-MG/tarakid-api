import { IsArray, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReassignBatchBookingsDto {
  @ApiProperty({
    example: ['uuid1', 'uuid2'],
    description: 'List of booking IDs (UUID for regular, Number for trial)',
    type: [String],
  })
  @IsArray()
  bookingIds: (string | number)[];

  @ApiProperty({
    example: 'REGULAR',
    enum: ['REGULAR', 'FREE_TRIAL'],
    description: 'The type of the bookings in this batch',
  })
  @IsEnum(['REGULAR', 'FREE_TRIAL'])
  type: 'REGULAR' | 'FREE_TRIAL';

  @ApiProperty({
    example: 123,
    description: 'The ID of the teacher to assign to the entire batch',
  })
  @IsNumber()
  teacherId: number;
}
