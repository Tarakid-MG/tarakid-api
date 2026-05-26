import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { FeedbackRating } from '../entities/feedback.entity';

export class CreateFeedbackDto {
  @ApiProperty({ example: '3f7a0a4e-b7e9-4e88-a0b2-834af3ec6f1a' })
  @IsUUID()
  bookingId: string;

  @ApiProperty({ enum: FeedbackRating, example: FeedbackRating.LIKE })
  @IsEnum(FeedbackRating)
  rating: FeedbackRating;

  @ApiProperty({
    example: 'The lesson was engaging and the teacher explained clearly.',
    required: false,
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}
