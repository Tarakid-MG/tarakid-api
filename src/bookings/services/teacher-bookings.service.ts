import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Booking, BookingStatus } from '../entities/booking.entity';
import { TeacherAvailability } from '../entities/teacher-availability.entity';
import { TeacherBreak } from '../entities/teacher-break.entity';
import { User } from '../../users/user.entity';
import {
  FreeTrialBooking,
  BookingStatus as TrialStatus,
} from '../../free-trial/entities/free-trial-booking.entity';
import { TeacherStats } from '../interfaces/teacher-stats.interface';
import { SetAvailabilityDto } from '../dto/set-availability.dto';
import { SetBreakDto } from '../dto/set-break.dto';

@Injectable()
export class TeacherBookingsService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(TeacherAvailability)
    private teacherAvailabilityRepository: Repository<TeacherAvailability>,
    @InjectRepository(TeacherBreak)
    private teacherBreakRepository: Repository<TeacherBreak>,
    @InjectRepository(FreeTrialBooking)
    private freeTrialBookingRepository: Repository<FreeTrialBooking>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

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
        const sessionDate = new Date(tb.session.date);
        return sessionDate >= now && sessionDate <= thirtyDaysLater;
      })
      .map((tb) => ({
        id: `trial_${tb.id}`,
        sessionDate: tb.session.date,
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

    const competences = {
      poor: 20,
      belowAverage: 20,
      average: 20,
      good: 20,
      competent: 20,
    };

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

  async markAbsent(id: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({ where: { id } });
    if (!booking) {
      throw new NotFoundException('Réservation non trouvée');
    }
    booking.status = BookingStatus.ABSENT;
    return await this.bookingRepository.save(booking);
  }
}
