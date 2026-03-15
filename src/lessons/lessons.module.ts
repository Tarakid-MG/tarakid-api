import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Unit } from './entities/unit.entity';
import { Lesson } from './entities/lesson.entity';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';
import { MinioModule } from '../minio/minio.module';
import { Booking } from '../bookings/entities/booking.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { FreeTrialBooking } from '../free-trial/entities/free-trial-booking.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Unit,
      Lesson,
      Booking,
      Subscription,
      FreeTrialBooking,
    ]),
    MinioModule,
  ],
  controllers: [LessonsController],
  providers: [LessonsService],
  exports: [LessonsService],
})
export class LessonsModule {}
