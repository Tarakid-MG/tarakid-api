import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetBreakDto {
  @ApiProperty({ example: '2026-03-20', description: 'Start date YYYY-MM-DD' })
  @IsString()
  startDate: string;

  @ApiProperty({ example: '2026-03-24', description: 'End date YYYY-MM-DD' })
  @IsString()
  endDate: string;

  @ApiProperty({ example: 'Vacances', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
