import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
  In,
} from 'typeorm';
import { Booking, BookingStatus } from '../entities/booking.entity';
import { TeacherAvailability } from '../entities/teacher-availability.entity';
import { TeacherBreak } from '../entities/teacher-break.entity';
import {
  FreeTrialBooking,
  BookingStatus as TrialStatus,
} from '../../free-trial/entities/free-trial-booking.entity';

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
export class AvailabilityService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(TeacherAvailability)
    private teacherAvailabilityRepository: Repository<TeacherAvailability>,
    @InjectRepository(TeacherBreak)
    private teacherBreakRepository: Repository<TeacherBreak>,
    @InjectRepository(FreeTrialBooking)
    private freeTrialBookingRepository: Repository<FreeTrialBooking>,
  ) {}

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
          session: {
            date: date,
            startTime: Between(`${time}:00`, `${time}:59`),
          },
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

  // importer dans le booking.controller
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

  // importer dans le booking.controller
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

  // importer dans le booking.admin.controller
  async getAvailableTeachersForSlot(
    dateStr: string,
    timeStr: string,
  ): Promise<number[]> {
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
    return teacherIds.filter((id) => !breakTeacherIds.has(id));
  }

  async getTeacherAvailability(
    teacherId: number,
  ): Promise<TeacherAvailability[]> {
    return this.teacherAvailabilityRepository.find({
      where: { teacherId },
    });
  }
}
