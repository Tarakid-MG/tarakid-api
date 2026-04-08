import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThanOrEqual, Repository, FindOptionsWhere } from 'typeorm';
import { Booking, BookingStatus } from '../entities/booking.entity';
import {
  FreeTrialBooking,
  BookingStatus as TrialStatus,
} from '../../free-trial/entities/free-trial-booking.entity';
import { User } from '../../users/user.entity';
import { AvailabilityService } from './availability.service';
import {
  BookingAssignmentHistory,
  BookingTypeEnum,
} from '../entities/booking-assignment-history.entity';

@Injectable()
export class AdminBookingsService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(FreeTrialBooking)
    private freeTrialBookingRepository: Repository<FreeTrialBooking>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(BookingAssignmentHistory)
    private assignmentHistoryRepository: Repository<BookingAssignmentHistory>,
    private availabilityService: AvailabilityService,
  ) {}

  async getAllBookedSlots(): Promise<
    { date: string; time: string; type: string; id: string | number }[]
  > {
    const regularBookingsRaw = await this.bookingRepository
      .createQueryBuilder('booking')
      .select("DATE_FORMAT(booking.sessionDate, '%Y-%m-%d')", 'date')
      .addSelect('booking.startTime', 'time')
      .addSelect('booking.id', 'id')
      .where('booking.status = :status', { status: BookingStatus.SCHEDULED })
      .getRawMany();

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
          id: `trial_${tb.id}`,
          date: String(tb.date),
          time: tb.time.substring(0, 5),
          type: 'FREE_TRIAL',
        }),
      ),
    ];

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
    const availableTeacherIds =
      await this.availabilityService.getAvailableTeachersForSlot(
        dateStr,
        timeStr,
      );

    if (availableTeacherIds.length === 0) return [];

    const teachers = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id IN (:...ids)', { ids: availableTeacherIds })
      .andWhere('user.role = :role', { role: 'TEACHER' })
      .getMany();

    return teachers.sort((a, b) => {
      const perfA = Number(a.commitmentScore) || 0;
      const perfB = Number(b.commitmentScore) || 0;
      return perfB - perfA;
    });
  }

  async assignTeacherToBooking(
    bookingId: string | number,
    type: 'REGULAR' | 'FREE_TRIAL',
    teacherId: number,
    adminUser?: User,
  ): Promise<void> {
    let previousTeacherId: number | null = null;
    if (type === 'FREE_TRIAL') {
      const id =
        typeof bookingId === 'string'
          ? Number(bookingId.replace('trial_', ''))
          : Number(bookingId);
      const booking = await this.freeTrialBookingRepository.findOne({
        where: { id },
      });
      if (!booking) throw new NotFoundException('Free trial booking not found');
      previousTeacherId = booking.teacherId;
      booking.teacherId = teacherId;
      await this.freeTrialBookingRepository.save(booking);
    } else {
      const booking = await this.bookingRepository.findOne({
        where: { id: String(bookingId) },
      });
      if (!booking) throw new NotFoundException('Booking not found');
      previousTeacherId = booking.teacherId;
      booking.teacherId = teacherId;
      await this.bookingRepository.save(booking);
    }

    if (adminUser) {
      const [prevTeacher, newTeacher] = await Promise.all([
        previousTeacherId
          ? this.userRepository.findOne({ where: { id: previousTeacherId } })
          : Promise.resolve(null),
        teacherId
          ? this.userRepository.findOne({ where: { id: teacherId } })
          : Promise.resolve(null),
      ]);

      await this.assignmentHistoryRepository.save({
        bookingId: String(bookingId),
        bookingType:
          type === 'REGULAR'
            ? BookingTypeEnum.REGULAR
            : BookingTypeEnum.FREE_TRIAL,
        previousTeacherId,
        previousTeacherName: prevTeacher
          ? `${prevTeacher.firstName || ''} ${prevTeacher.lastName || ''}`.trim() ||
            prevTeacher.email
          : null,
        newTeacherId: teacherId,
        newTeacherName: newTeacher
          ? `${newTeacher.firstName || ''} ${newTeacher.lastName || ''}`.trim() ||
            newTeacher.email
          : null,
        assignedById: adminUser.id,
        assignedByRole: adminUser.role,
        assignedByName:
          `${adminUser.firstName || ''} ${adminUser.lastName || ''}`.trim() ||
          adminUser.email,
      });
    }
  }

  async unassignTeacherFromBooking(
    bookingId: string | number,
    type: 'REGULAR' | 'FREE_TRIAL',
    adminUser?: User,
  ): Promise<void> {
    let previousTeacherId: number | null = null;
    if (type === 'FREE_TRIAL') {
      const id =
        typeof bookingId === 'string'
          ? Number(bookingId.replace('trial_', ''))
          : Number(bookingId);
      const booking = await this.freeTrialBookingRepository.findOne({
        where: { id },
      });
      if (!booking) throw new NotFoundException('Free trial booking not found');
      previousTeacherId = booking.teacherId;
      booking.teacherId = null;
      await this.freeTrialBookingRepository.save(booking);
    } else {
      const booking = await this.bookingRepository.findOne({
        where: { id: String(bookingId) },
      });
      if (!booking) throw new NotFoundException('Booking not found');
      previousTeacherId = booking.teacherId;
      booking.teacherId = null;
      await this.bookingRepository.save(booking);
    }

    if (adminUser) {
      const prevTeacher = previousTeacherId
        ? await this.userRepository.findOne({
            where: { id: previousTeacherId },
          })
        : null;

      await this.assignmentHistoryRepository.save({
        bookingId: String(bookingId),
        bookingType:
          type === 'REGULAR'
            ? BookingTypeEnum.REGULAR
            : BookingTypeEnum.FREE_TRIAL,
        previousTeacherId,
        previousTeacherName: prevTeacher
          ? `${prevTeacher.firstName || ''} ${prevTeacher.lastName || ''}`.trim() ||
            prevTeacher.email
          : null,
        newTeacherId: null,
        newTeacherName: null,
        assignedById: adminUser.id,
        assignedByRole: adminUser.role,
        assignedByName:
          `${adminUser.firstName || ''} ${adminUser.lastName || ''}`.trim() ||
          adminUser.email,
      });
    }
  }

  async getAssignmentHistory(): Promise<BookingAssignmentHistory[]> {
    return this.assignmentHistoryRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async getAssignedBookings(): Promise<any[]> {
    const [regularBookings, trialBookings] = await Promise.all([
      this.bookingRepository.find({
        where: {
          teacherId: MoreThanOrEqual(1),
          status: BookingStatus.SCHEDULED,
        },
        relations: ['kid'],
      }),
      this.freeTrialBookingRepository.find({
        where: {
          teacherId: MoreThanOrEqual(1),
          status: TrialStatus.CONFIRMED,
        },
        relations: ['session', 'kid'],
      }),
    ]);

    const teacherIds = Array.from(
      new Set([
        ...regularBookings
          .filter((b) => b.teacherId !== null)
          .map((b) => b.teacherId as number),
        ...trialBookings
          .filter((tb) => tb.teacherId !== null)
          .map((tb) => tb.teacherId as number),
      ]),
    );

    let teacherMap = new Map<number, User>();
    if (teacherIds.length > 0) {
      const teachers = await this.userRepository.find({
        where: { id: In(teacherIds) },
      });
      teacherMap = new Map(teachers.map((t) => [t.id, t]));
    }

    const formattedRegular = regularBookings.map((b) => {
      const teacher = b.teacherId ? teacherMap.get(b.teacherId) : null;
      return {
        id: b.id,
        date:
          b.sessionDate instanceof Date
            ? b.sessionDate.toISOString().split('T')[0]
            : b.sessionDate,
        startTime: b.startTime,
        endTime: b.endTime,
        status: b.status,
        type: 'REGULAR',
        teacher: {
          id: b.teacherId,
          firstName: teacher?.firstName || '',
          lastName: teacher?.lastName || '',
          email: teacher?.email || '',
        },
        kid: b.kid
          ? { id: b.kid.id, name: b.kid.name }
          : { id: '?', name: 'Inconnu' },
      };
    });

    const formattedTrial = trialBookings
      .filter((tb) => tb.session)
      .map((tb) => {
        const teacher = tb.teacherId ? teacherMap.get(tb.teacherId) : null;
        return {
          id: `trial_${tb.id}`,
          date: tb.session.date,
          startTime: tb.session.startTime,
          endTime: tb.session.endTime,
          status: tb.status,
          type: 'FREE_TRIAL',
          teacher: {
            id: tb.teacherId,
            firstName: teacher?.firstName || '',
            lastName: teacher?.lastName || '',
            email: teacher?.email || '',
          },
          kid: tb.kid
            ? { id: tb.kid.id, name: tb.kid.name }
            : { id: '?', name: 'Inconnu' },
        };
      });

    const all = [...formattedRegular, ...formattedTrial];

    return all.sort((a, b) => {
      const dtA = new Date(`${a.date}T${a.startTime}`).getTime();
      const dtB = new Date(`${b.date}T${b.startTime}`).getTime();
      return dtA - dtB;
    });
  }

  async getBookingHistory(): Promise<any[]> {
    const [regularBookings, trialBookings] = await Promise.all([
      this.bookingRepository.find({
        where: {
          status: In([
            BookingStatus.COMPLETED,
            BookingStatus.CANCELLED,
            BookingStatus.ABSENT,
            BookingStatus.MISSED,
            BookingStatus.REPORTED,
            BookingStatus.DONE_BUT_MISSING,
          ]),
        },
        relations: ['kid'],
      }),
      this.freeTrialBookingRepository.find({
        where: {
          status: In([TrialStatus.CANCELLED, TrialStatus.REPORTED]),
        },
        relations: ['session', 'kid'],
      }),
    ]);

    const teacherIds = Array.from(
      new Set([
        ...regularBookings
          .filter((b) => b.teacherId !== null)
          .map((b) => b.teacherId as number),
        ...trialBookings
          .filter((tb) => tb.teacherId !== null)
          .map((tb) => tb.teacherId as number),
      ]),
    );

    let teacherMap = new Map<number, User>();
    if (teacherIds.length > 0) {
      const teachers = await this.userRepository.find({
        where: { id: In(teacherIds) },
      });
      teacherMap = new Map(teachers.map((t) => [t.id, t]));
    }

    const formattedRegular = regularBookings.map((b) => {
      const teacher = b.teacherId ? teacherMap.get(b.teacherId) : null;
      return {
        id: b.id,
        date:
          b.sessionDate instanceof Date
            ? b.sessionDate.toISOString().split('T')[0]
            : b.sessionDate,
        startTime: b.startTime,
        endTime: b.endTime,
        status: b.status,
        type: 'REGULAR',
        teacher: b.teacherId
          ? {
              id: b.teacherId,
              firstName: teacher?.firstName || '',
              lastName: teacher?.lastName || '',
              email: teacher?.email || '',
            }
          : null,
        kid: b.kid
          ? { id: b.kid.id, name: b.kid.name }
          : { id: '?', name: 'Inconnu' },
      };
    });

    const formattedTrial = trialBookings
      .filter((tb) => tb.session)
      .map((tb) => {
        const teacher = tb.teacherId ? teacherMap.get(tb.teacherId) : null;
        return {
          id: `trial_${tb.id}`,
          date: tb.session.date,
          startTime: tb.session.startTime,
          endTime: tb.session.endTime,
          status: tb.status,
          type: 'FREE_TRIAL',
          teacher: tb.teacherId
            ? {
                id: tb.teacherId,
                firstName: teacher?.firstName || '',
                lastName: teacher?.lastName || '',
                email: teacher?.email || '',
              }
            : null,
          kid: tb.kid
            ? { id: tb.kid.id, name: tb.kid.name }
            : { id: '?', name: 'Inconnu' },
        };
      });

    const all = [...formattedRegular, ...formattedTrial];

    return all.sort((a, b) => {
      const dtA = new Date(`${a.date}T${a.startTime}`).getTime();
      const dtB = new Date(`${b.date}T${b.startTime}`).getTime();
      return dtB - dtA;
    });
  }

  async reassignKidBookings(
    kidId: string,
    teacherId: number,
    includeHistory: boolean = false,
  ): Promise<void> {
    const regularCriteria: FindOptionsWhere<Booking> = { kidId };
    const trialCriteria: FindOptionsWhere<FreeTrialBooking> = { kidId };

    if (!includeHistory) {
      regularCriteria.status = BookingStatus.SCHEDULED;
      trialCriteria.status = TrialStatus.CONFIRMED;
    }

    await Promise.all([
      this.bookingRepository.update(regularCriteria, { teacherId }),
      this.freeTrialBookingRepository.update(trialCriteria, { teacherId }),
    ]);
  }

  async reassignBatchBookings(
    bookingIds: (string | number)[],
    type: 'REGULAR' | 'FREE_TRIAL',
    teacherId: number,
  ): Promise<void> {
    if (type === 'FREE_TRIAL') {
      await this.freeTrialBookingRepository.update(
        {
          id: In(
            bookingIds.map((id) =>
              typeof id === 'string' ? Number(id.replace('trial_', '')) : id,
            ),
          ),
        },
        { teacherId },
      );
    } else {
      await this.bookingRepository.update(
        { id: In(bookingIds.map(String)) },
        { teacherId },
      );
    }
  }

  async getTeacherUpcoming(teacherId: number): Promise<any[]> {
    const [regularBookings, trialBookings] = await Promise.all([
      this.bookingRepository.find({
        where: {
          teacherId,
          status: BookingStatus.SCHEDULED,
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

    const formattedRegular = regularBookings.map((b) => ({
      id: b.id,
      sessionDate:
        b.sessionDate instanceof Date
          ? b.sessionDate.toISOString().split('T')[0]
          : b.sessionDate,
      startTime: b.startTime,
      endTime: b.endTime,
      status: b.status,
      type: 'REGULAR',
      kid: b.kid ? { id: b.kid.id, name: b.kid.name } : null,
    }));

    const formattedTrial = trialBookings
      .filter((tb) => tb.session)
      .map((tb) => ({
        id: `trial_${tb.id}`,
        sessionDate: tb.session.date,
        startTime: tb.session.startTime,
        endTime: tb.session.endTime,
        status: tb.status,
        type: 'FREE_TRIAL',
        kid: tb.kid ? { id: tb.kid.id, name: tb.kid.name } : null,
      }));

    return [...formattedRegular, ...formattedTrial].sort((a, b) => {
      const dtA = new Date(`${a.sessionDate}T${a.startTime}`).getTime();
      const dtB = new Date(`${b.sessionDate}T${b.startTime}`).getTime();
      return dtA - dtB;
    });
  }
  async getBookingDetails(bookingId: string): Promise<any> {
    if (bookingId.startsWith('trial_')) {
      const id = parseInt(bookingId.replace('trial_', ''), 10);
      const booking = await this.freeTrialBookingRepository.findOne({
        where: { id },
        relations: ['kid', 'kid.user', 'session'],
      });
      if (!booking) throw new NotFoundException('Booking not found');
      return {
        id: `trial_${booking.id}`,
        type: 'FREE_TRIAL',
        status: booking.status,
        date: booking.session?.date,
        time: booking.session?.startTime,
        kid: booking.kid,
        parent: booking.kid?.user,
      };
    } else {
      const booking = await this.bookingRepository.findOne({
        where: { id: bookingId },
        relations: ['kid', 'kid.user'],
      });
      if (!booking) throw new NotFoundException('Booking not found');
      return {
        id: booking.id,
        type: 'REGULAR',
        status: booking.status,
        date: booking.sessionDate,
        time: booking.startTime,
        kid: booking.kid,
        parent: booking.kid?.user,
      };
    }
  }
}
