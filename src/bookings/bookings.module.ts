import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsController } from './controller/bookings.controller';
import { BookingsAdminController } from './controller/bookings.admin.controller';
import { BookingsTeacherController } from './controller/bookings.teacher.controller';
import { BookingsService } from './services/bookings.service';
import { AvailabilityService } from './services/availability.service';
import { TeacherBookingsService } from './services/teacher-bookings.service';
import { AdminBookingsService } from './services/admin-bookings.service';
import { BookingsClientController } from './controller/bookings.client.controller';

import { BookingsNotifierService } from './services/bookings-notifier.service';
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

import { BookingAssignmentHistory } from './entities/booking-assignment-history.entity';

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
      BookingAssignmentHistory,
    ]),
    SubscriptionsModule,
    ConfigModule,
  ],
  controllers: [
    BookingsController,
    BookingsAdminController,
    BookingsTeacherController,
    BookingsClientController,
  ],
  providers: [
    BookingsService,
    AvailabilityService,
    TeacherBookingsService,
    AdminBookingsService,
    BookingsNotifierService,
    MailerService,
  ],
  exports: [
    BookingsService,
    AvailabilityService,
    TeacherBookingsService,
    AdminBookingsService,
  ],
})
export class BookingsModule {}
