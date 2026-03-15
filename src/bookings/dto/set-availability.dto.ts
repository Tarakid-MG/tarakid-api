import {
  IsArray,
  IsString,
  IsInt,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/** One recurring slot: a weekday + time, repeats every week */
export class AvailabilitySlotDto {
  @ApiProperty({ example: 1, description: '0=Sun, 1=Mon, ..., 6=Sat' })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({ example: '10:00:00' })
  @IsString()
  startTime: string;

  @ApiProperty({ example: '10:25:00' })
  @IsString()
  endTime: string;
}

export class SetAvailabilityDto {
  @ApiProperty({ type: [AvailabilitySlotDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilitySlotDto)
  slots: AvailabilitySlotDto[];
}
