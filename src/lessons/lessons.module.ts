import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Unit } from './entities/unit.entity';
import { Lesson } from './entities/lesson.entity';
import { LessonsController } from './controller/lessons.controller';
import { LessonsAdminController } from './controller/lessons.admin.controller';
import { LessonsService } from './lessons.service';

import { MinioModule } from '../minio/minio.module';
import { Booking } from '../bookings/entities/booking.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { FreeTrialBooking } from '../free-trial/entities/free-trial-booking.entity';

import { Level } from './entities/level.entity';
import { LevelRule } from './entities/level-rule.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Unit,
      Lesson,
      Booking,
      Subscription,
      FreeTrialBooking,
      Level,
      LevelRule,
    ]),
    MinioModule,
  ],
  controllers: [LessonsController, LessonsAdminController],
  providers: [LessonsService],
  exports: [LessonsService],
})
export class LessonsModule {}
