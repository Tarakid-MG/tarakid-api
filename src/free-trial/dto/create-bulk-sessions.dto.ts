import {
  IsDateString,
  IsString,
  IsInt,
  Min,
  Matches,
  IsArray,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBulkSessionsDto {
  @ApiProperty({ example: '2026-02-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-02-28' })
  @IsDateString()
  endDate: string;

  @ApiProperty({
    example: [1, 3, 5],
    description: '0 for Sunday, 1 for Monday, etc.',
  })
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  daysOfWeek: number[];

  @ApiProperty({ example: ['10:00', '11:00'] })
  @IsArray()
  @IsString({ each: true })
  @Matches(/^([01]\d|2[0-3]):?([0-5]\d)$/, { each: true })
  startTimes: string[];

  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(1)
  capacity: number;
}
