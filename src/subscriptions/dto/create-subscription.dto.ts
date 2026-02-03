import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CommitmentType } from '../entities/subscription.entity';

export class CreateSubscriptionDto {
  @ApiProperty({
    required: false,
    description: 'ID of the kid (optional for individual accounts)',
  })
  @IsOptional()
  @IsUUID()
  kidId?: string;

  @ApiProperty({ example: '2x / semaine - threeMonths' })
  @IsString()
  planName: string;

  @ApiProperty({ example: 2, description: 'Number of classes per week' })
  @IsNumber()
  frequency: number;

  @ApiProperty({ enum: CommitmentType })
  @IsEnum(CommitmentType)
  commitmentType: CommitmentType;

  @ApiProperty({ example: 8, description: 'Credits per month' })
  @IsNumber()
  creditsPerMonth: number;

  @ApiProperty({ example: 200000, description: 'Price per month in Ariary' })
  @IsNumber()
  pricePerMonth: number;
}
