import {
  IsUUID,
  IsArray,
  ValidateNested,
  IsString,
  IsBoolean,
  IsOptional,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { RecurrencePattern } from '../interfaces/recurrence-pattern.interface';

class BookingSlotDto {
  @ApiProperty({ example: '2026-02-03' })
  @IsString()
  sessionDate: string;

  @ApiProperty({ example: '18:00' })
  @IsString()
  startTime: string;

  @ApiProperty({ example: '18:25' })
  @IsString()
  endTime: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  isRecurring: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  recurrencePattern?: RecurrencePattern;
}

export class CreateBookingDto {
  @ApiProperty()
  @IsUUID()
  subscriptionId: string;

  @ApiProperty()
  @IsUUID()
  kidId: string;

  @ApiProperty({ type: [BookingSlotDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookingSlotDto)
  bookings: BookingSlotDto[];

  @ApiProperty({ required: false, example: 42 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  teacherId?: number;
}
