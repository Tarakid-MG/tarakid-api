import { IsDateString, IsString, IsInt, Min, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSessionDto {
  @ApiProperty({ example: '2026-02-01' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: '10:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):?([0-5]\d)$/)
  startTime: string;

  @ApiProperty({ example: '10:25' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):?([0-5]\d)$/)
  endTime: string;

  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(1)
  capacity: number;
}
