import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Between,
  LessThanOrEqual,
  MoreThanOrEqual,
  In,
} from 'typeorm';
import { Booking, BookingStatus } from './entities/booking.entity';
import {
  Subscription,
  SubscriptionStatus,
} from '../subscriptions/entities/subscription.entity';
import { Kid } from '../kids/kid.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { User } from '../users/user.entity';
import {
  FreeTrialBooking,
  BookingStatus as TrialStatus,
} from '../free-trial/entities/free-trial-booking.entity';
import { TeacherAvailability } from './entities/teacher-availability.entity';
import { TeacherBreak } from './entities/teacher-break.entity';
import { SetAvailabilityDto } from './dto/set-availability.dto';
import { SetBreakDto } from './dto/set-break.dto';
import { TeacherStats } from './interfaces/teacher-stats.interface';

interface RawBookingCount {
  date: string;
  startTime: string;
  count: string | number;
}

interface RawTrialBookingCount {
  date: string;
  startTime: string;
  count: string | number;
}

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Kid)
    private kidRepository: Repository<Kid>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(TeacherAvailability)
    private teacherAvailabilityRepository: Repository<TeacherAvailability>,
    @InjectRepository(TeacherBreak)
    private teacherBreakRepository: Repository<TeacherBreak>,
    @InjectRepository(FreeTrialBooking)
    private freeTrialBookingRepository: Repository<FreeTrialBooking>,
    private subscriptionsService: SubscriptionsService,
  ) {}

  async create(
    userId: number,
    createBookingDto: CreateBookingDto,
  ): Promise<Booking[]> {
    // Validate subscription
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: createBookingDto.subscriptionId, userId },
    });

    if (!subscription) {
      throw new NotFoundException('Abonnement non trouvé');
    }

    if (
      subscription.status !== SubscriptionStatus.ACTIVE &&
      subscription.status !== SubscriptionStatus.PENDING_PAYMENT
    ) {
      throw new BadRequestException('Abonnement non valide');
    }

    // Validate kid
    const kid = await this.kidRepository.findOne({
      where: { id: createBookingDto.kidId, userId },
    });

    if (!kid) {
      throw new BadRequestException('Enfant non trouvé');
    }

    // Validate booking constraints
    await this.validateBookingConstraints(
      subscription,
      createBookingDto.bookings,
    );

    // Create bookings without teacher assignment (teacher will be assigned later)
    const bookings: Booking[] = [];
    for (const bookingSlot of createBookingDto.bookings) {
      const sessionDate = new Date(bookingSlot.sessionDate);
      const dayOfWeek = sessionDate.getDay();
      const dateStr = sessionDate.toISOString().split('T')[0];

      const isAvailable = await this.isSlotAvailable(
        dateStr,
        bookingSlot.startTime,
      );
      if (!isAvailable) {
        throw new BadRequestException(
          `Aucun créneau disponible pour le ${dateStr} à ${bookingSlot.startTime}.`,
        );
      }

      const booking = this.bookingRepository.create({
        subscriptionId: createBookingDto.subscriptionId,
        kidId: createBookingDto.kidId,
        userId,
        sessionDate,
        startTime: bookingSlot.startTime,
        endTime: bookingSlot.endTime,
        dayOfWeek,
        isRecurring: bookingSlot.isRecurring,
        recurrencePattern: bookingSlot.recurrencePattern,
        status: BookingStatus.SCHEDULED,
      });

      bookings.push(booking);
    }

    const savedBookings = await this.bookingRepository.save(bookings);

    // Decrement credits
    await this.subscriptionsService.decrementCredits(
      createBookingDto.subscriptionId,
      createBookingDto.bookings.length,
    );

    return savedBookings;
  }

  private async validateBookingConstraints(
    subscription: Subscription,
    requestedSlots: Array<{ sessionDate: string }>,
  ): Promise<void> {
    // Check if each date is within subscription validity
    for (const slot of requestedSlots) {
      const sessionDate = new Date(slot.sessionDate);
      // Normalize dates for comparison (ignoring time)
      const start = new Date(subscription.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(subscription.endDate);
      end.setHours(23, 59, 59, 999);

      if (sessionDate < start || sessionDate > end) {
        throw new BadRequestException(
          `La date ${slot.sessionDate} est en dehors de la période de validité de votre abonnement ` +
            `(${start.toLocaleDateString()} au ${end.toLocaleDateString()}).`,
        );
      }
    }

    // Overridden by user request: Allow booking even if credits are 0
    /*
    if (subscription.remainingCredits < requestedSlots.length) {
      throw new BadRequestException(
        `Crédits insuffisants. Vous avez ${subscription.remainingCredits} crédits restants.`,
      );
    }
    */

    // Check weekly frequency limits
    // Group requested slots by week (using year-week number)
    const weeklyRequested: { [week: string]: number } = {};
    for (const slot of requestedSlots) {
      const date = new Date(slot.sessionDate);
      const weekKey = this.getWeekKey(date);
      weeklyRequested[weekKey] = (weeklyRequested[weekKey] || 0) + 1;
    }

    // Check each week
    for (const weekKey in weeklyRequested) {
      const countInRequest = weeklyRequested[weekKey];

      // Get existing bookings for this week
      const [year, week] = weekKey.split('-').map(Number);
      const weekRange = this.getWeekRange(year, week);

      const existingCount = await this.bookingRepository.count({
        where: {
          subscriptionId: subscription.id,
          sessionDate: Between(weekRange.start, weekRange.end),
          status: BookingStatus.SCHEDULED,
        },
      });

      if (existingCount + countInRequest > subscription.frequency) {
        throw new BadRequestException(
          `Limite hebdomadaire dépassée pour la semaine du ${weekRange.start.toLocaleDateString()}. ` +
            `Votre plan autorise ${subscription.frequency} cours par semaine.`,
        );
      }
    }
  }

  private getWeekKey(date: Date): string {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(
      ((Number(d) - Number(yearStart)) / 86400000 + 1) / 7,
    );
    return `${d.getUTCFullYear()}-${weekNo}`;
  }

  private getWeekRange(year: number, week: number): { start: Date; end: Date } {
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = simple;
    if (dow <= 4) ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    else ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());

    const end = new Date(ISOweekStart);
    end.setDate(end.getDate() + 6);
    return { start: ISOweekStart, end };
  }

  async isSlotAvailable(date: string, startTime: string): Promise<boolean> {
    const dayOfWeek = new Date(date).getDay();
    const time = startTime.substring(0, 5);

    // 1. Get total potential capacity for this slot
    const recurringSlots = await this.teacherAvailabilityRepository.find({
      where: {
        dayOfWeek,
        startTime: Between(`${time}:00`, `${time}:59`),
      },
    });

    if (recurringSlots.length === 0) return false;

    // 2. Subtract teachers on break
    const breaks = await this.teacherBreakRepository.find({
      where: {
        startDate: LessThanOrEqual(date),
        endDate: MoreThanOrEqual(date),
      },
    });

    const breakTeacherIds = new Set(breaks.map((b) => b.teacherId));
    const effectiveCapacity = recurringSlots.filter(
      (s) => !breakTeacherIds.has(s.teacherId),
    ).length;

    if (effectiveCapacity === 0) return false;

    // 3. Count all bookings for this slot
    const [regularCount, trialCount] = await Promise.all([
      this.bookingRepository.count({
        where: {
          sessionDate: date as unknown as Date,
          startTime: Between(`${time}:00`, `${time}:59`),
          status: BookingStatus.SCHEDULED,
        },
      }),
      this.freeTrialBookingRepository.count({
        where: {
          status: TrialStatus.CONFIRMED,
          session: {
            date: date,
            startTime: Between(`${time}:00`, `${time}:59`),
          },
        },
        relations: ['session'],
      }),
    ]);

    return effectiveCapacity > regularCount + trialCount;
  }

  // Keep findAvailableTeacher for compatibility or admin use, but make it use the same logic
  async findAvailableTeacher(
    date: string,
    startTime: string,
  ): Promise<number | null> {
    const dayOfWeek = new Date(date).getDay();
    const time = startTime.substring(0, 5);

    const potentialTeachers = await this.teacherAvailabilityRepository.find({
      where: {
        dayOfWeek,
        startTime: Between(`${time}:00`, `${time}:59`),
      },
    });

    if (potentialTeachers.length === 0) return null;

    const breaks = await this.teacherBreakRepository.find({
      where: {
        startDate: LessThanOrEqual(date),
        endDate: MoreThanOrEqual(date),
      },
    });

    const breakTeacherIds = new Set(breaks.map((b) => b.teacherId));
    const teachersNotOnBreak = potentialTeachers.filter(
      (t) => !breakTeacherIds.has(t.teacherId),
    );

    if (teachersNotOnBreak.length === 0) return null;

    const [regularBookings, trialBookings] = await Promise.all([
      this.bookingRepository.find({
        where: {
          sessionDate: date as unknown as Date,
          startTime: Between(`${time}:00`, `${time}:59`),
          status: BookingStatus.SCHEDULED,
        },
      }),
      this.freeTrialBookingRepository.find({
        where: {
          status: TrialStatus.CONFIRMED,
        },
        relations: ['session'],
      }),
    ]);

    const activeTrialBookings = trialBookings.filter(
      (tb) =>
        tb.session &&
        tb.session.date === date &&
        tb.session.startTime.substring(0, 5) === time &&
        tb.teacherId,
    );

    const bookedTeacherIds = new Set([
      ...regularBookings.filter((b) => b.teacherId).map((b) => b.teacherId),
      ...activeTrialBookings.map((tb) => tb.teacherId),
    ]);

    const finalAvailableTeachers = teachersNotOnBreak.filter(
      (t) => !bookedTeacherIds.has(t.teacherId),
    );

    return finalAvailableTeachers.length > 0
      ? finalAvailableTeachers[0].teacherId
      : null;
  }

  async findByKid(kidId: string, userId: number): Promise<Booking[]> {
    return this.bookingRepository.find({
      where: { kidId, userId },
      order: { sessionDate: 'ASC', startTime: 'ASC' },
    });
  }

  async findUpcoming(kidId: string, userId: number): Promise<Booking[]> {
    return this.bookingRepository.find({
      where: {
        kidId,
        userId,
        status: BookingStatus.SCHEDULED,
      },
      order: { sessionDate: 'ASC', startTime: 'ASC' },
    });
  }

  async findBySubscription(
    subscriptionId: string,
    userId: number,
  ): Promise<Booking[]> {
    return this.bookingRepository.find({
      where: { subscriptionId, userId },
      order: { sessionDate: 'ASC', startTime: 'ASC' },
    });
  }

  async getSuggestedSchedules(subscriptionId: string): Promise<any[]> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Abonnement non trouvé');
    }

    // Generate suggested schedules based on frequency
    const suggestions: {
      id: string;
      name: string;
      description: string;
      slots: { dayOfWeek: number; time: string }[];
    }[] = [];
    const frequency = subscription.frequency;

    // Suggestion 1: Morning slots (9 AM)
    if (frequency === 1) {
      suggestions.push({
        id: 'morning-1',
        name: 'Matinée - Lundi',
        description: 'Chaque lundi à 9h00',
        slots: [{ dayOfWeek: 1, time: '09:00' }],
      });
    } else if (frequency === 2) {
      suggestions.push({
        id: 'morning-2',
        name: 'Matinées - Lundi & Mercredi',
        description: 'Chaque lundi et mercredi à 9h00',
        slots: [
          { dayOfWeek: 1, time: '09:00' },
          { dayOfWeek: 3, time: '09:00' },
        ],
      });
    } else if (frequency === 3) {
      suggestions.push({
        id: 'morning-3',
        name: 'Matinées - Lun, Mer, Ven',
        description: 'Chaque lundi, mercredi et vendredi à 9h00',
        slots: [
          { dayOfWeek: 1, time: '09:00' },
          { dayOfWeek: 3, time: '09:00' },
          { dayOfWeek: 5, time: '09:00' },
        ],
      });
    }

    // Suggestion 2: Evening slots (6 PM)
    if (frequency === 1) {
      suggestions.push({
        id: 'evening-1',
        name: 'Soirée - Mercredi',
        description: 'Chaque mercredi à 18h00',
        slots: [{ dayOfWeek: 3, time: '18:00' }],
      });
    } else if (frequency === 2) {
      suggestions.push({
        id: 'evening-2',
        name: 'Soirées - Mardi & Jeudi',
        description: 'Chaque mardi et jeudi à 18h00',
        slots: [
          { dayOfWeek: 2, time: '18:00' },
          { dayOfWeek: 4, time: '18:00' },
        ],
      });
    } else if (frequency === 3) {
      suggestions.push({
        id: 'evening-3',
        name: 'Soirées - Lun, Mer, Ven',
        description: 'Chaque lundi, mercredi et vendredi à 18h00',
        slots: [
          { dayOfWeek: 1, time: '18:00' },
          { dayOfWeek: 3, time: '18:00' },
          { dayOfWeek: 5, time: '18:00' },
        ],
      });
    }

    // Suggestion 3: Afternoon slots (2 PM)
    if (frequency === 2) {
      suggestions.push({
        id: 'afternoon-2',
        name: 'Après-midi - Samedi & Dimanche',
        description: 'Chaque samedi et dimanche à 14h00',
        slots: [
          { dayOfWeek: 6, time: '14:00' },
          { dayOfWeek: 0, time: '14:00' },
        ],
      });
    }

    return suggestions;
  }

  async getGlobalAvailability(): Promise<{
    slotCapacities: Record<string, number>;
    bookings: Array<{ date: string; startTime: string; count: number }>;
  }> {
    // 1. Get recurring capacities
    const recurringSlots = await this.teacherAvailabilityRepository.find();
    const slotCapacities: Record<string, number> = {};

    recurringSlots.forEach((slot) => {
      const time = slot.startTime.substring(0, 5);
      const key = `${slot.dayOfWeek}-${time}`;
      slotCapacities[key] = (slotCapacities[key] || 0) + 1;
    });

    // 2. Get current bookings occupancy
    const bookingsRaw = await this.bookingRepository
      .createQueryBuilder('booking')
      .select("DATE_FORMAT(booking.sessionDate, '%Y-%m-%d')", 'date')
      .addSelect('booking.startTime', 'startTime')
      .addSelect('COUNT(*)', 'count')
      .where('booking.status = :status', { status: BookingStatus.SCHEDULED })
      .groupBy('booking.sessionDate')
      .addGroupBy('booking.startTime')
      .getRawMany();

    const bookings = (bookingsRaw as unknown as RawBookingCount[]).map((b) => ({
      date: String(b.date),
      startTime: b.startTime.substring(0, 5),
      count: parseInt(String(b.count), 10),
    }));

    // 2.1 Get Free Trial bookings occupancy
    const trialBookingsRaw = await this.freeTrialBookingRepository
      .createQueryBuilder('tb')
      .leftJoinAndSelect('tb.session', 'session')
      .select("DATE_FORMAT(session.date, '%Y-%m-%d')", 'date')
      .addSelect('session.startTime', 'startTime')
      .addSelect('COUNT(*)', 'count')
      .where('tb.status = :status', { status: TrialStatus.CONFIRMED })
      .groupBy('session.date')
      .addGroupBy('session.startTime')
      .getRawMany();

    trialBookingsRaw.forEach((tb) => {
      const raw = tb as unknown as RawTrialBookingCount;
      const dateStr = String(raw.date);
      const time = raw.startTime.substring(0, 5);
      const existing = bookings.find(
        (b) => b.date === dateStr && b.startTime === time,
      );
      if (existing) {
        existing.count += parseInt(String(raw.count), 10);
      } else {
        bookings.push({
          date: dateStr,
          startTime: time,
          count: parseInt(String(raw.count), 10),
        });
      }
    });

    return {
      slotCapacities,
      bookings,
    };
  }

  async getAvailableDates(
    months = 2,
  ): Promise<{ available: string[]; full: string[] }> {
    // 1. Get recurring capacities
    const recurringSlots = await this.teacherAvailabilityRepository.find();
    const recurringDows = new Set(recurringSlots.map((s) => s.dayOfWeek));
    const slotCapacities: Record<string, number> = {};
    recurringSlots.forEach((slot) => {
      const time = slot.startTime.substring(0, 5);
      const key = `${slot.dayOfWeek}-${time}`;
      slotCapacities[key] = (slotCapacities[key] || 0) + 1;
    });

    // 2. Get range
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + months);

    const dateRange = {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
    };

    // 3. Get all breaks and bookings for the range
    const [breaks, regularBookings, trialBookings] = await Promise.all([
      this.teacherBreakRepository.find({
        where: {
          endDate: Between(dateRange.start, dateRange.end),
        },
      }),
      this.bookingRepository
        .createQueryBuilder('booking')
        .select("DATE_FORMAT(booking.sessionDate, '%Y-%m-%d')", 'date')
        .addSelect('booking.startTime', 'startTime')
        .addSelect('COUNT(*)', 'count')
        .where('booking.status = :status', { status: BookingStatus.SCHEDULED })
        .andWhere('booking.sessionDate BETWEEN :start AND :end', {
          start: dateRange.start,
          end: dateRange.end,
        })
        .groupBy('booking.sessionDate')
        .addGroupBy('booking.startTime')
        .getRawMany(),
      this.freeTrialBookingRepository
        .createQueryBuilder('tb')
        .leftJoinAndSelect('tb.session', 'session')
        .select("DATE_FORMAT(session.date, '%Y-%m-%d')", 'date')
        .addSelect('session.startTime', 'startTime')
        .addSelect('COUNT(*)', 'count')
        .where('tb.status = :status', { status: TrialStatus.CONFIRMED })
        .andWhere('session.date BETWEEN :start AND :end', {
          start: dateRange.start,
          end: dateRange.end,
        })
        .groupBy('session.date')
        .addGroupBy('session.startTime')
        .getRawMany(),
    ]);

    // Consolidate occupancy
    const occupancy: Record<string, Record<string, number>> = {}; // { date: { time: count } }

    (regularBookings as unknown as RawBookingCount[]).forEach((b) => {
      const dateStr = String(b.date);
      const time = b.startTime.substring(0, 5);
      if (!occupancy[dateStr]) occupancy[dateStr] = {};
      occupancy[dateStr][time] =
        (occupancy[dateStr][time] || 0) + parseInt(String(b.count), 10);
    });

    (trialBookings as unknown as RawTrialBookingCount[]).forEach((tb) => {
      const dateStr = String(tb.date);
      const time = tb.startTime.substring(0, 5);
      if (!occupancy[dateStr]) occupancy[dateStr] = {};
      occupancy[dateStr][time] =
        (occupancy[dateStr][time] || 0) + parseInt(String(tb.count), 10);
    });

    // 4. Iterate through dates and check availability
    const available: string[] = [];
    const full: string[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      const dow = current.getDay();

      if (recurringDows.has(dow)) {
        const potentialSlots = Object.keys(slotCapacities).filter((key) =>
          key.startsWith(`${dow}-`),
        );

        const availableSlotsForDay = potentialSlots.filter((key) => {
          const time = key.split('-')[1];
          const totalCapacity = slotCapacities[key];

          // Calculate teachers on break for this specific slot
          const teachersOnBreak = breaks.filter(
            (b) =>
              b.startDate <= dateStr &&
              b.endDate >= dateStr &&
              recurringSlots.some(
                (rs) =>
                  rs.teacherId === b.teacherId &&
                  rs.dayOfWeek === dow &&
                  rs.startTime.substring(0, 5) === time,
              ),
          ).length;

          const effectiveCapacity = totalCapacity - teachersOnBreak;
          const occupied = occupancy[dateStr]?.[time] || 0;

          return effectiveCapacity > occupied;
        });

        if (availableSlotsForDay.length > 0) {
          available.push(dateStr);
        } else if (potentialSlots.length > 0) {
          full.push(dateStr);
        }
      }
      current.setDate(current.getDate() + 1);
    }

    return { available, full };
  }

  async cancelBooking(id: string, userId: number): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id, userId },
    });

    if (!booking) {
      throw new NotFoundException('Réservation non trouvée');
    }

    if (booking.status !== BookingStatus.SCHEDULED) {
      throw new BadRequestException(
        'Seule une réservation planifiée peut être annulée',
      );
    }

    const now = new Date();
    const [hours, minutes] = booking.startTime.split(':');
    const sessionDateTime = new Date(booking.sessionDate);
    sessionDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    const diffHours =
      (sessionDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours >= 5) {
      // More than 5 hours: Refund and mark as CANCELLED
      booking.status = BookingStatus.CANCELLED;

      const subscription = await this.subscriptionRepository.findOne({
        where: { id: booking.subscriptionId },
      });

      if (subscription) {
        subscription.remainingCredits += 1;
        await this.subscriptionRepository.save(subscription);
      }
    } else {
      // Less than 5 hours: No refund, mark as DONE_BUT_MISSING
      booking.status = BookingStatus.DONE_BUT_MISSING;
    }

    return await this.bookingRepository.save(booking);
  }

  async reportBooking(id: string, userId: number): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id, userId },
    });

    if (!booking) {
      throw new NotFoundException('Réservation non trouvée');
    }

    if (booking.status !== BookingStatus.SCHEDULED) {
      throw new BadRequestException(
        'Seule une réservation planifiée peut être reportée',
      );
    }

    const now = new Date();
    const [hours, minutes] = booking.startTime.split(':');
    const sessionDateTime = new Date(booking.sessionDate);
    sessionDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    const diffHours =
      (sessionDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours >= 5) {
      // More than 5 hours: Refund and mark as REPORTED
      booking.status = BookingStatus.REPORTED;

      const subscription = await this.subscriptionRepository.findOne({
        where: { id: booking.subscriptionId },
      });

      if (subscription) {
        subscription.remainingCredits += 1;
        await this.subscriptionRepository.save(subscription);
      }
    } else {
      // Less than 5 hours: No refund, mark as DONE_BUT_MISSING
      booking.status = BookingStatus.DONE_BUT_MISSING;
    }

    return await this.bookingRepository.save(booking);
  }

  async markAbsent(id: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({ where: { id } });
    if (!booking) {
      throw new NotFoundException('Réservation non trouvée');
    }
    booking.status = BookingStatus.ABSENT;
    return await this.bookingRepository.save(booking);
  }

  async findTeacherUpcoming(teacherId: number): Promise<any[]> {
    const now = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(now.getDate() + 30);

    const [regularBookings, trialBookings] = await Promise.all([
      this.bookingRepository.find({
        where: {
          teacherId,
          status: BookingStatus.SCHEDULED,
          sessionDate: Between(now, thirtyDaysLater),
        },
        relations: ['kid'],
      }),
      this.freeTrialBookingRepository.find({
        where: {
          teacherId,
          status: TrialStatus.CONFIRMED,
        },
        relations: ['session', 'kid'],
      }),
    ]);

    const formattedRegular = regularBookings.map((b) => {
      // sessionDate is usually a Date object or string from TypeORM
      const sDate =
        b.sessionDate instanceof Date ? b.sessionDate : new Date(b.sessionDate);
      const year = sDate.getFullYear();
      const month = String(sDate.getMonth() + 1).padStart(2, '0');
      const day = String(sDate.getDate()).padStart(2, '0');
      const sessionDateStr = `${year}-${month}-${day}`;

      return {
        id: b.id,
        sessionDate: sessionDateStr,
        startTime: b.startTime,
        endTime: b.endTime,
        status: b.status,
        type: 'REGULAR',
        kid: b.kid
          ? {
              id: b.kid.id,
              name: b.kid.name,
              age: b.kid.age,
              level: b.kid.level,
            }
          : { id: '?', name: 'Inconnu', age: 0, level: 'L0' },
      };
    });

    const formattedTrial = trialBookings
      .filter((tb) => {
        if (!tb.session) return false;
        // Filter by date range (30 days)
        const sessionDate = new Date(tb.session.date);
        return sessionDate >= now && sessionDate <= thirtyDaysLater;
      })
      .map((tb) => ({
        id: `trial_${tb.id}`,
        sessionDate: tb.session.date, // already string from DB if type: 'date'
        startTime: tb.session.startTime,
        endTime: tb.session.endTime,
        status: tb.status,
        type: 'FREE_TRIAL',
        kid: tb.kid
          ? {
              id: tb.kid.id,
              name: tb.kid.name,
              age: tb.kid.age,
              level: tb.kid.level,
            }
          : { id: '?', name: 'Inconnu', age: 0, level: 'L0' },
      }));

    const allSessions = [...formattedRegular, ...formattedTrial];

    return allSessions.sort((a, b) => {
      const dtA = new Date(`${a.sessionDate}T${a.startTime}`).getTime();
      const dtB = new Date(`${b.sessionDate}T${b.startTime}`).getTime();
      return dtA - dtB;
    });
  }

  async getTeacherStats(teacherId: number): Promise<TeacherStats> {
    const teacher = await this.userRepository.findOne({
      where: { id: teacherId },
    });

    if (!teacher) throw new NotFoundException('Enseignant non trouvé');

    const commitmentScore = Number(teacher.commitmentScore) || 10;
    const currentCompetence =
      (String(teacher.competenceLevel || 'average') as
        | 'poor'
        | 'belowAverage'
        | 'average'
        | 'good'
        | 'competent') || 'average';

    // Competences distribution (weights for the gauge segments)
    const competences = {
      poor: 20,
      belowAverage: 20,
      average: 20,
      good: 20,
      competent: 20,
    };

    // Earnings: sum of completed bookings * rate (5000 Ar per class)
    const completedCount = await this.bookingRepository.count({
      where: { teacherId, status: BookingStatus.COMPLETED },
    });

    const earnings = {
      total: completedCount * 5000,
      currency: 'Ar',
      ratePerClass: 5000,
    };

    const performance = {
      finishedCourses: Number(teacher.finishedCourses || 0),
      canceledCourses: Number(teacher.canceledCourses || 0),
      lateCourses: Number(teacher.lateCourses || 0),
      thumbsUp: Number(teacher.thumbsUp || 0),
      thumbsDown: Number(teacher.thumbsDown || 0),
      stars: {
        5: Number(teacher.star5 || 0),
        4: Number(teacher.star4 || 0),
        3: Number(teacher.star3 || 0),
        2: Number(teacher.star2 || 0),
        1: Number(teacher.star1 || 0),
      },
    };

    return {
      commitmentScore,
      currentCompetence,
      competences,
      earnings,
      performance,
    };
  }

  async getTeacherAvailability(
    teacherId: number,
  ): Promise<TeacherAvailability[]> {
    return await this.teacherAvailabilityRepository.find({
      where: { teacherId },
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }

  async setTeacherAvailability(
    teacherId: number,
    dto: SetAvailabilityDto,
  ): Promise<TeacherAvailability[]> {
    // Validate: no blackout slots (Fri 18h – Sat 18h)
    const slots = dto.slots || [];
    for (const slot of slots) {
      const dow = Number(slot.dayOfWeek);
      if (isNaN(dow) || dow < 0 || dow > 6) {
        throw new BadRequestException(
          'dayOfWeek must be a number between 0 and 6.',
        );
      }
      if (!slot.startTime || !slot.endTime) {
        throw new BadRequestException('startTime and endTime are required.');
      }

      const hour = parseInt(String(slot.startTime).split(':')[0], 10);
      if (isNaN(hour)) {
        throw new BadRequestException('Invalid time format.');
      }
      if (dow === 5 && hour >= 18) {
        throw new BadRequestException(
          `Le vendredi à partir de 18h est bloqué.`,
        );
      }
      if (dow === 6 && hour < 18) {
        throw new BadRequestException(`Le samedi avant 18h est bloqué.`);
      }
    }

    // Replace all recurring slots
    await this.teacherAvailabilityRepository.delete({ teacherId });

    const entities = slots.map((slot) =>
      this.teacherAvailabilityRepository.create({
        teacherId,
        dayOfWeek: Number(slot.dayOfWeek),
        startTime: String(slot.startTime),
        endTime: String(slot.endTime),
      }),
    );

    return await this.teacherAvailabilityRepository.save(entities);
  }

  // ── Teacher Breaks ────────────────────────────────────────────────────────

  async getTeacherBreaks(teacherId: number): Promise<TeacherBreak[]> {
    return await this.teacherBreakRepository.find({
      where: { teacherId },
      order: { startDate: 'ASC' },
    });
  }

  async addTeacherBreak(
    teacherId: number,
    dto: SetBreakDto,
  ): Promise<TeacherBreak> {
    if (dto.startDate > dto.endDate) {
      throw new BadRequestException(
        'La date de début doit être avant la date de fin.',
      );
    }
    const entity = this.teacherBreakRepository.create({
      teacherId,
      startDate: dto.startDate,
      endDate: dto.endDate,
      reason: dto.reason,
    });
    return await this.teacherBreakRepository.save(entity);
  }

  async removeTeacherBreak(teacherId: number, breakId: string): Promise<void> {
    const existing = await this.teacherBreakRepository.findOne({
      where: { id: breakId, teacherId },
    });
    if (!existing) throw new NotFoundException('Break non trouvé.');
    await this.teacherBreakRepository.delete({ id: breakId });
  }

  // ── Admin Teacher Assignment ──────────────────────────────────────────────

  async getAllBookedSlots(): Promise<
    { date: string; time: string; type: string; id: string | number }[]
  > {
    // Regular bookings
    const regularBookingsRaw = await this.bookingRepository
      .createQueryBuilder('booking')
      .select("DATE_FORMAT(booking.sessionDate, '%Y-%m-%d')", 'date')
      .addSelect('booking.startTime', 'time')
      .addSelect('booking.id', 'id')
      .where('booking.status = :status', { status: BookingStatus.SCHEDULED })
      .getRawMany();

    // Free Trial bookings
    const trialBookingsRaw = await this.freeTrialBookingRepository
      .createQueryBuilder('tb')
      .leftJoinAndSelect('tb.session', 'session')
      .select("DATE_FORMAT(session.date, '%Y-%m-%d')", 'date')
      .addSelect('session.startTime', 'time')
      .addSelect('tb.id', 'id')
      .where('tb.status = :status', { status: TrialStatus.CONFIRMED })
      .getRawMany();

    const slots = [
      ...(
        regularBookingsRaw as { id: string; date: string; time: string }[]
      ).map((b) => ({
        id: b.id,
        date: String(b.date),
        time: b.time.substring(0, 5),
        type: 'REGULAR',
      })),
      ...(trialBookingsRaw as { id: number; date: string; time: string }[]).map(
        (tb) => ({
          id: tb.id,
          date: String(tb.date),
          time: tb.time.substring(0, 5),
          type: 'FREE_TRIAL',
        }),
      ),
    ];

    // Sort ascending by date and time
    return slots.sort((a, b) => {
      const dtA = new Date(`${a.date}T${a.time}`).getTime();
      const dtB = new Date(`${b.date}T${b.time}`).getTime();
      return dtA - dtB;
    });
  }

  async getAvailableTeachersForSlot(
    dateStr: string,
    timeStr: string,
  ): Promise<User[]> {
    const sessionDate = new Date(dateStr);
    const dayOfWeek = sessionDate.getDay();

    // 1. Find all teachers who have recurring availability for this dow & time
    const recurringSlots = await this.teacherAvailabilityRepository.find({
      where: {
        dayOfWeek,
        startTime: Between(`${timeStr}:00`, `${timeStr}:59`),
      },
    });

    if (recurringSlots.length === 0) return [];

    const teacherIds = recurringSlots.map((s) => s.teacherId);

    // 2. Exclude teachers on break for this date
    const breaks = await this.teacherBreakRepository.find({
      where: {
        teacherId: In(teacherIds),
        startDate: LessThanOrEqual(dateStr),
        endDate: MoreThanOrEqual(dateStr),
      },
    });

    const breakTeacherIds = new Set(breaks.map((b) => b.teacherId));
    const availableTeacherIds = teacherIds.filter(
      (id) => !breakTeacherIds.has(id),
    );

    if (availableTeacherIds.length === 0) return [];

    // 3. Load teachers and sort by performanceLevel descending
    const teachers = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id IN (:...ids)', { ids: availableTeacherIds })
      .andWhere('user.role = :role', { role: 'TEACHER' })
      .getMany();

    // Assuming commitmentScore is a number
    return teachers.sort((a, b) => {
      const perfA = Number(a.commitmentScore) || 0;
      const perfB = Number(b.commitmentScore) || 0;
      return perfB - perfA; // Descending
    });
  }

  async assignTeacherToBooking(
    bookingId: string | number,
    type: 'REGULAR' | 'FREE_TRIAL',
    teacherId: number,
  ): Promise<void> {
    if (type === 'FREE_TRIAL') {
      const booking = await this.freeTrialBookingRepository.findOne({
        where: { id: Number(bookingId) },
      });
      if (!booking) throw new NotFoundException('Free trial booking not found');
      booking.teacherId = teacherId;
      await this.freeTrialBookingRepository.save(booking);
    } else {
      const booking = await this.bookingRepository.findOne({
        where: { id: String(bookingId) },
      });
      if (!booking) throw new NotFoundException('Booking not found');
      booking.teacherId = teacherId;
      await this.bookingRepository.save(booking);
    }
  }
}
