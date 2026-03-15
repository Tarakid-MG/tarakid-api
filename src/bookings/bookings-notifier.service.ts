import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Booking, BookingStatus } from './entities/booking.entity';
import { User } from '../users/user.entity';
import { MailerService } from '../auth/services/mailer.service';

@Injectable()
export class BookingsNotifierService implements OnModuleInit, OnModuleDestroy {
  private intervalRef: ReturnType<typeof setInterval>;

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly mailerService: MailerService,
  ) {}

  onModuleInit() {
    // Run every 5 minutes to check for upcoming bookings
    this.intervalRef = setInterval(
      () => void this.checkAndSendReminders(),
      5 * 60 * 1000,
    );
    // Also run once immediately on startup
    void this.checkAndSendReminders();
  }

  onModuleDestroy() {
    clearInterval(this.intervalRef);
  }

  async checkAndSendReminders() {
    const now = new Date();
    // Window: from now+55min to now+65min (gives a 10-minute window around 1 hour)
    const windowStart = new Date(now.getTime() + 55 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 65 * 60 * 1000);

    // Find all scheduled bookings with session time in this window
    const upcomingBookings = await this.bookingRepository.find({
      where: {
        status: BookingStatus.SCHEDULED,
        sessionDate: Between(
          new Date(windowStart.toISOString().split('T')[0]),
          new Date(windowEnd.toISOString().split('T')[0]),
        ),
      },
    });

    if (!upcomingBookings.length) return;

    for (const booking of upcomingBookings) {
      try {
        // Build full session datetime to compare
        const [hours, minutes] = booking.startTime.split(':');
        const sessionDateTime = new Date(booking.sessionDate);
        sessionDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        const diffMs = sessionDateTime.getTime() - now.getTime();
        const diffMins = diffMs / 60000;

        // Only send if within the 55-65 minute window
        if (diffMins < 55 || diffMins > 65) continue;

        const user = await this.userRepository.findOne({
          where: { id: booking.userId },
        });
        if (!user?.email) continue;

        await this.mailerService.sendCourseReminder(
          user.email,
          user.firstName || 'there',
          {
            date: booking.sessionDate.toString(),
            startTime: booking.startTime,
            endTime: booking.endTime,
          },
        );

        console.log(`Reminder sent to ${user.email} for booking ${booking.id}`);
      } catch (err) {
        console.error(
          `Failed to send reminder for booking ${booking.id}:`,
          err,
        );
      }
    }
  }
}
