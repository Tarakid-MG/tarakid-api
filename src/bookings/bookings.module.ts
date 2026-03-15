import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { BookingsNotifierService } from './bookings-notifier.service';
import { Booking } from './entities/booking.entity';
import { TeacherAvailability } from './entities/teacher-availability.entity';
import { TeacherBreak } from './entities/teacher-break.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { Kid } from '../kids/kid.entity';
import { User } from '../users/user.entity';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { MailerService } from '../auth/services/mailer.service';
import { ConfigModule } from '@nestjs/config';
import { FreeTrialBooking } from '../free-trial/entities/free-trial-booking.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Booking,
      TeacherAvailability,
      TeacherBreak,
      Subscription,
      Kid,
      User,
      FreeTrialBooking,
    ]),
    SubscriptionsModule,
    ConfigModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService, BookingsNotifierService, MailerService],
  exports: [BookingsService],
})
export class BookingsModule {}
