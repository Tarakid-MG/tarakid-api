import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from '../users/user.entity';
import { Kid } from '../kids/kid.entity';
import { FreeTrialSession } from '../free-trial/entities/free-trial-session.entity';
import { FreeTrialBooking } from '../free-trial/entities/free-trial-booking.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { Unit } from '../lessons/entities/unit.entity';
import { Lesson } from '../lessons/entities/lesson.entity';
import { TeacherAvailability } from '../bookings/entities/teacher-availability.entity';
import { TeacherBreak } from '../bookings/entities/teacher-break.entity';
import { Level } from '../lessons/entities/level.entity';
import { BookingAssignmentHistory } from '../bookings/entities/booking-assignment-history.entity';

export const AppDataSource = new DataSource({
  type: 'mariadb',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [
    User,
    Kid,
    FreeTrialSession,
    FreeTrialBooking,
    Subscription,
    Booking,
    Unit,
    Lesson,
    TeacherAvailability,
    TeacherBreak,
    Level,
    BookingAssignmentHistory,
  ],
  migrations: [
    process.env.NODE_ENV === 'production'
      ? 'dist/database/migrations/*.js'
      : 'src/database/migrations/*.ts',
  ],
  synchronize: false,
});
