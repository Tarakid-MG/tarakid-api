import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { Feedback } from './entities/feedback.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Feedback, Booking])],
  controllers: [FeedbackController],
  providers: [FeedbackService],
})
export class FeedbackModule {}
