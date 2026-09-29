import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
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
import { LessonsService } from '../../lessons/lessons.service';
import { KidLevel } from '../../kids/enums/kid-level.enum';
import { Feedback, FeedbackRating } from '../../feedback/entities/feedback.entity';

interface FormattedSession {
  id: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  status: string;
  type: string;
  kid: { id: string; name: string; age: number; level: KidLevel };
  lesson: { id: string; title: string; order: number } | null;
  suggestedLesson?: { id: string; title: string; order: number } | null;
  isTeacherInClass: boolean;
  isKidWaiting: boolean;
  interactionData?: string | null;
}

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
    @InjectRepository(Feedback)
    private feedbackRepository: Repository<Feedback>,
    private readonly lessonsService: LessonsService,
  ) {}

  async findTeacherUpcoming(teacherId: number): Promise<any[]> {
    const allSessions = await this.getFormattedTeacherSessions(teacherId);
    const now = new Date();
    const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    return allSessions
      .filter((session) => {
        if (
          session.status === BookingStatus.CANCELLED ||
          session.status === TrialStatus.CANCELLED
        ) {
          return false;
        }
        const start = this.toSessionDate(session.sessionDate, session.startTime);
        const end = this.toSessionDate(session.sessionDate, session.endTime);
        return end >= now && start <= in48Hours;
      })
      .sort((a, b) => {
        const dtA = this.toSessionDate(a.sessionDate, a.startTime).getTime();
        const dtB = this.toSessionDate(b.sessionDate, b.startTime).getTime();
        return dtA - dtB;
      });
  }

  async findTeacherCalendarSessions(teacherId: number): Promise<any[]> {
    const allSessions = await this.getFormattedTeacherSessions(teacherId);

    return allSessions.sort((a, b) => {
      const dtA = this.toSessionDate(a.sessionDate, a.startTime).getTime();
      const dtB = this.toSessionDate(b.sessionDate, b.startTime).getTime();
      return dtA - dtB;
    });
  }

  private async getFormattedTeacherSessions(
    teacherId: number,
  ): Promise<FormattedSession[]> {
    const [regularBookings, trialBookings] = await Promise.all([
      this.bookingRepository.find({
        where: {
          teacherId,
          status: In([
            BookingStatus.SCHEDULED,
            BookingStatus.COMPLETED,
            BookingStatus.CANCELLED,
            BookingStatus.MISSED,
            BookingStatus.ABSENT,
            BookingStatus.DONE_BUT_MISSING,
            BookingStatus.REPORTED,
          ]),
        },
        relations: ['kid', 'lesson'],
      }),
      this.freeTrialBookingRepository.find({
        where: {
          teacherId,
          status: In([
            TrialStatus.CONFIRMED,
            TrialStatus.CANCELLED,
            TrialStatus.COMPLETED,
            TrialStatus.REPORTED,
          ]),
        },
        relations: ['session', 'kid', 'lesson'],
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
          : { id: '?', name: 'Inconnu', age: 0, level: KidLevel.L0 },
        lesson: b.lesson
          ? {
              id: b.lesson.id,
              title: b.lesson.title,
              order: b.lesson.order,
            }
          : null,
        isTeacherInClass: b.isTeacherInClass,
        isKidWaiting: b.isKidWaiting,
        interactionData: b.interactionData,
      };
    });

    const formattedTrial = trialBookings
      .filter((tb) => !!tb.session)
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
          : { id: '?', name: 'Inconnu', age: 0, level: KidLevel.L0 },
        lesson: tb.lesson
          ? {
              id: tb.lesson.id,
              title: tb.lesson.title,
              order: tb.lesson.order,
            }
          : null,
        isTeacherInClass: tb.isTeacherInClass,
        isKidWaiting: tb.isKidWaiting,
        interactionData: tb.interactionData,
      }));

    const allSessions: FormattedSession[] = [
      ...formattedRegular,
      ...formattedTrial,
    ];

    // Add suggested lesson if no lesson is assigned
    for (const session of allSessions) {
      if (!session.lesson && session.kid?.id && session.kid?.level) {
        session.suggestedLesson = await this.lessonsService.getSuggestedLesson(
          session.kid.id,
          session.kid.level,
        );
      }
    }

    return allSessions;
  }

  async getTeacherStats(teacherId: number): Promise<TeacherStats> {
    const teacher = await this.userRepository.findOne({
      where: { id: teacherId },
    });

    if (!teacher) throw new NotFoundException('Enseignant non trouvé');

    const [regularBookings, trialBookings, feedbackRows] = await Promise.all([
      this.bookingRepository.find({ where: { teacherId } }),
      this.freeTrialBookingRepository.find({
        where: { teacherId },
        relations: ['session'],
      }),
      this.feedbackRepository
        .createQueryBuilder('feedback')
        .innerJoin('feedback.booking', 'booking')
        .where('booking.teacherId = :teacherId', { teacherId })
        .getMany(),
    ]);

    const now = new Date();
    const isRegularFinished = (booking: Booking) => {
      if (booking.status === BookingStatus.COMPLETED) return true;
      if (booking.status !== BookingStatus.SCHEDULED) return false;
      return this.toSessionDate(booking.sessionDate, booking.endTime) < now;
    };
    const isTrialFinished = (booking: FreeTrialBooking) => {
      if (booking.status === TrialStatus.COMPLETED) return true;
      if (booking.status !== TrialStatus.CONFIRMED || !booking.session) {
        return false;
      }
      return this.toSessionDate(booking.session.date, booking.session.endTime) < now;
    };

    const finishedCourses =
      regularBookings.filter(isRegularFinished).length +
      trialBookings.filter(isTrialFinished).length;
    const canceledCourses =
      regularBookings.filter((b) => b.status === BookingStatus.CANCELLED).length +
      trialBookings.filter((b) => b.status === TrialStatus.CANCELLED).length;
    const lateCourses = regularBookings.filter((b) =>
      [
        BookingStatus.MISSED,
        BookingStatus.ABSENT,
        BookingStatus.DONE_BUT_MISSING,
      ].includes(b.status),
    ).length;

    const thumbsUp = feedbackRows.filter(
      (feedback) => feedback.rating === FeedbackRating.LIKE,
    ).length;
    const thumbsDown = feedbackRows.filter(
      (feedback) => feedback.rating === FeedbackRating.DISLIKE,
    ).length;

    const scoredCourses = finishedCourses + canceledCourses + lateCourses;
    const completionQuality =
      scoredCourses > 0 ? finishedCourses / scoredCourses : 1;
    const feedbackTotal = thumbsUp + thumbsDown;
    const feedbackQuality = feedbackTotal > 0 ? thumbsUp / feedbackTotal : 1;
    const competenceScore = Math.round(
      (completionQuality * 0.65 + feedbackQuality * 0.35) * 100,
    );
    const currentCompetence = this.getCompetenceLevel(competenceScore);
    const hearts = Math.max(0, Math.min(5, Number(teacher.hearts ?? 5)));
    const commitmentScore = hearts * 2;

    const competences = {
      poor: currentCompetence === 'poor' ? competenceScore : 0,
      belowAverage: currentCompetence === 'belowAverage' ? competenceScore : 0,
      average: currentCompetence === 'average' ? competenceScore : 0,
      good: currentCompetence === 'good' ? competenceScore : 0,
      competent: currentCompetence === 'competent' ? competenceScore : 0,
    };

    const earnings = {
      total: finishedCourses * 5000,
      currency: 'Ar',
      ratePerClass: 5000,
    };

    const performance = {
      finishedCourses,
      canceledCourses,
      lateCourses,
      thumbsUp,
      thumbsDown,
      stars: {
        5: thumbsUp,
        4: 0,
        3: 0,
        2: 0,
        1: thumbsDown,
      },
    };

    return {
      commitmentScore,
      hearts,
      maxHearts: 5,
      currentCompetence,
      competences,
      earnings,
      performance,
    };
  }

  private toSessionDate(date: Date | string, time: string): Date {
    const datePart =
      date instanceof Date
        ? date.toISOString().split('T')[0]
        : String(date).split('T')[0];
    return new Date(`${datePart}T${String(time).substring(0, 5)}:00`);
  }

  private getCompetenceLevel(
    score: number,
  ): 'poor' | 'belowAverage' | 'average' | 'good' | 'competent' {
    if (score < 40) return 'poor';
    if (score < 55) return 'belowAverage';
    if (score < 70) return 'average';
    if (score < 85) return 'good';
    return 'competent';
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

  async cancelBooking(teacherId: number, bookingId: string): Promise<any> {
    const isTrial = bookingId.startsWith('trial_');
    const id = isTrial
      ? parseInt(bookingId.split('_').pop() || '', 10)
      : bookingId;

    let booking: Booking | FreeTrialBooking | null;
    if (isTrial) {
      booking = await this.freeTrialBookingRepository.findOne({
        where: { id: id as number, teacherId },
        relations: ['session', 'kid'],
      });
    } else {
      booking = await this.bookingRepository.findOne({
        where: { id: id as string, teacherId },
        relations: ['kid'],
      });
    }

    if (!booking) {
      throw new NotFoundException(
        'Réservation non trouvée ou non assignée à vous.',
      );
    }

    const sessionDate =
      isTrial && 'session' in booking
        ? new Date(booking.session.date)
        : new Date((booking as Booking).sessionDate);
    const [hours, minutes] = (
      isTrial && 'session' in booking
        ? booking.session.startTime
        : (booking as Booking).startTime
    ).split(':');
    sessionDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

    const now = new Date();
    const diffMs = sessionDate.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    let penaltyApplied = false;
    if (diffHours < 24 && diffHours > -1) {
      // Penalty applies if within 24h of future class
      const teacher = await this.userRepository.findOne({
        where: { id: teacherId },
      });
      if (teacher && teacher.hearts > 0) {
        teacher.hearts -= 1;
        await this.userRepository.save(teacher);
        penaltyApplied = true;
      }
    }

    // Unassign teacher and put back to waiting list (SCHEDULED/CONFIRMED)
    booking.teacherId = null;
    booking.status = isTrial ? TrialStatus.CONFIRMED : BookingStatus.SCHEDULED;

    if (isTrial) {
      await this.freeTrialBookingRepository.save(
        booking as unknown as FreeTrialBooking,
      );
    } else {
      await this.bookingRepository.save(booking as unknown as Booking);
    }

    return { success: true, penaltyApplied };
  }

  async assignLessonToBooking(
    teacherId: number,
    bookingId: string,
    lessonId: string,
  ): Promise<any> {
    const isTrial = bookingId.startsWith('trial_');
    const id = isTrial
      ? parseInt(bookingId.split('_').pop() || '', 10)
      : bookingId;

    let booking: Booking | FreeTrialBooking | null;
    if (isTrial) {
      booking = await this.freeTrialBookingRepository.findOne({
        where: { id: id as number, teacherId },
      });
    } else {
      booking = await this.bookingRepository.findOne({
        where: { id: id as string, teacherId },
      });
    }

    if (!booking) {
      throw new NotFoundException(
        'Réservation non trouvée ou non assignée à vous.',
      );
    }

    booking.lessonId = lessonId;

    if (isTrial) {
      return await this.freeTrialBookingRepository.save(
        booking as unknown as FreeTrialBooking,
      );
    } else {
      return await this.bookingRepository.save(booking as unknown as Booking);
    }
  }

  async updateClassroomStatus(
    bookingId: string,
    update: {
      isKidWaiting?: boolean;
      isKidAccepted?: boolean;
      isTeacherInClass?: boolean;
    },
  ): Promise<any> {
    const isTrial = bookingId.startsWith('trial_');
    const id = isTrial
      ? parseInt(bookingId.split('_').pop() || '', 10)
      : bookingId;

    if (isTrial) {
      const booking = await this.freeTrialBookingRepository.findOne({
        where: { id: id as number },
      });
      if (!booking) throw new NotFoundException('Réservation non trouvée');
      Object.assign(booking, update);
      return this.freeTrialBookingRepository.save(booking);
    } else {
      const booking = await this.bookingRepository.findOne({
        where: { id: id as string },
      });
      if (!booking) throw new NotFoundException('Réservation non trouvée');
      Object.assign(booking, update);
      return this.bookingRepository.save(booking);
    }
  }

  async getClassroomStatus(bookingId: string): Promise<any> {
    const isTrial = bookingId.startsWith('trial_');
    const id = isTrial
      ? parseInt(bookingId.split('_').pop() || '', 10)
      : bookingId;

    if (isTrial) {
      const booking = await this.freeTrialBookingRepository.findOne({
        where: { id: id as number },
        relations: ['session', 'kid', 'lesson'],
      });
      if (!booking) throw new NotFoundException('Réservation non trouvée');
      return booking;
    } else {
      const booking = await this.bookingRepository.findOne({
        where: { id: id as string },
        relations: ['kid', 'lesson'],
      });
      if (!booking) throw new NotFoundException('Réservation non trouvée');
      return booking;
    }
  }

  async updateInteractionData(
    bookingId: string,
    interactionData: string,
  ): Promise<any> {
    const isTrial = bookingId.startsWith('trial_');
    const id = isTrial
      ? parseInt(bookingId.split('_').pop() || '', 10)
      : bookingId;

    if (isTrial) {
      await this.freeTrialBookingRepository.update(id as number, {
        interactionData,
      });
      return this.getClassroomStatus(bookingId);
    } else {
      await this.bookingRepository.update(id as string, { interactionData });
      return this.getClassroomStatus(bookingId);
    }
  }
}
