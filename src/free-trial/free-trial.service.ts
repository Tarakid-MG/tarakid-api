import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { FreeTrialSession } from './entities/free-trial-session.entity';
import {
  FreeTrialBooking,
  BookingStatus,
} from './entities/free-trial-booking.entity';
import { CreateSessionDto } from './dto/create-session.dto';
import { CreateBulkSessionsDto } from './dto/create-bulk-sessions.dto';
import { MailerService } from '../auth/services/mailer.service';
import { User } from '../users/user.entity';
import { BookingsService } from '../bookings/bookings.service';

@Injectable()
export class FreeTrialService {
  constructor(
    @InjectRepository(FreeTrialSession)
    private sessionRepository: Repository<FreeTrialSession>,
    @InjectRepository(FreeTrialBooking)
    private bookingRepository: Repository<FreeTrialBooking>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private bookingsService: BookingsService,
    private mailerService: MailerService,
  ) {}

  async createSession(
    createSessionDto: CreateSessionDto,
  ): Promise<FreeTrialSession> {
    const session = this.sessionRepository.create(createSessionDto);
    return this.sessionRepository.save(session);
  }

  async findAllAvailableSessions(): Promise<FreeTrialSession[]> {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    return this.sessionRepository.find({
      where: {
        date: MoreThan(today), // Simple future dated sessions
        isActive: true,
      },
      order: {
        date: 'ASC',
        startTime: 'ASC',
      },
    });
  }

  async bookSession(
    userId: number,
    sessionId: number,
    kidId?: string,
    teacherId?: number,
  ): Promise<FreeTrialBooking> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session non trouvée');
    }

    if (session.bookedSlots >= session.capacity) {
      throw new BadRequestException('Session complète');
    }

    // Logic split based on session type
    if (session.type === 'REGULAR') {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) throw new BadRequestException('Utilisateur non trouvé');

      if (user.credits < 1) {
        throw new BadRequestException(
          'Crédits insuffisants. Veuillez souscrire à un abonnement.',
        );
      }

      // Deduct credit
      user.credits -= 1;
      await this.userRepository.save(user);
    } else {
      // FREE_TRIAL checks
      // For now, let's say ONE free trial per KID if kidId is provided, or ONE per USER if not.

      // We need to join with session to check if it was a FREE_TRIAL
      // But doing a simple check on bookings for now since existing logic was:
      // "Check if user already has a booking"
      // We should ideally refine this to "Check if user has a FREE_TRIAL booking"
      // But existing bookings might not have session loaded in this check context easily without query update.
      // Simplified: If booking exists, check its session type or assume it was trial if we only had trials before.
      // Let's rely on checking checking against the repo.

      const existingBookings = await this.bookingRepository.find({
        where: { userId, status: BookingStatus.CONFIRMED },
        relations: ['session'],
      });

      const hasTrial = existingBookings.some(
        (b) => b.session && b.session.type === 'FREE_TRIAL',
      );

      // If kidId is provided, check if *this kid* has a trial.
      if (kidId) {
        const kidTrial = existingBookings.find(
          (b) => b.kidId === kidId && b.session?.type === 'FREE_TRIAL',
        );
        if (kidTrial)
          throw new BadRequestException(
            "Cet enfant a déjà fait un cours d'essai",
          );
      } else if (hasTrial) {
        // Relaxed: if user has trial but for another kid?
        // If booking without kidId, assume strict one per user.
        throw new BadRequestException(
          "Vous avez déjà réservé un cours d'essai",
        );
      }
    }

    const booking = this.bookingRepository.create({
      userId,
      sessionId,
      kidId: kidId,
      status: BookingStatus.CONFIRMED, // Auto confirm for now
      teacherId,
    });

    await this.bookingRepository.save(booking);

    // Update booked slots
    session.bookedSlots += 1;
    await this.sessionRepository.save(session);

    // Send confirmation email
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['kids'],
      }); // Ensure kids are loaded if needed
      if (user && user.email) {
        let userName = 'Parent';

        if (kidId && user.kids) {
          const kid = user.kids.find((k) => k.id === kidId);
          if (kid) userName = kid.name;
        } else if (user.kids && user.kids.length > 0) {
          // Fallback logic if kidId not provided but kids exist?
          // Usually kidId should be provided if kids exist.
          userName = user.kids[0].name;
        }

        await this.mailerService.sendBookingConfirmation(user.email, userName, {
          date: session.date,
          startTime: session.startTime,
          endTime: session.endTime,
        });
      }
    } catch (emailError) {
      // Log error but don't fail the booking
      console.error('Failed to send booking confirmation email:', emailError);
    }

    return booking;
  }

  async bookByDateTime(
    userId: number,
    date: string,
    startTime: string,
    kidId?: string,
  ): Promise<FreeTrialBooking> {
    const isAvailable = await this.bookingsService.isSlotAvailable(
      date,
      startTime,
    );

    if (!isAvailable) {
      throw new BadRequestException('Ce créneau n’est plus disponible');
    }

    // 2. Find or create a session for this slot
    let session = await this.sessionRepository.findOne({
      where: { date, startTime, type: 'FREE_TRIAL' },
    });

    if (!session) {
      session = this.sessionRepository.create({
        date,
        startTime,
        endTime: this.calculateEndTime(startTime),
        capacity: 10, // Default capacity for trials if not specified
        type: 'FREE_TRIAL',
        isActive: true,
      });
      await this.sessionRepository.save(session);
    }

    // 3. Book the session
    return this.bookSession(userId, session.id, kidId);
  }

  async deleteSession(id: number): Promise<void> {
    const session = await this.sessionRepository.findOne({ where: { id } });
    if (!session) {
      throw new NotFoundException('Session non trouvée');
    }
    if (session.bookedSlots > 0) {
      throw new BadRequestException(
        'Impossible de supprimer une session avec des réservations',
      );
    }
    await this.sessionRepository.remove(session);
  }

  async createBulkSessions(
    dto: CreateBulkSessionsDto,
  ): Promise<FreeTrialSession[]> {
    const { startDate, endDate, daysOfWeek, startTimes, capacity } = dto;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const sessions: FreeTrialSession[] = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (daysOfWeek.includes(d.getDay())) {
        for (const startTime of startTimes) {
          const session = this.sessionRepository.create({
            date: d.toISOString().split('T')[0],
            startTime,
            endTime: this.calculateEndTime(startTime),
            capacity,
          });
          sessions.push(session);
        }
      }
    }

    return this.sessionRepository.save(sessions);
  }

  async updateSession(
    id: number,
    updateData: Partial<FreeTrialSession>,
  ): Promise<FreeTrialSession> {
    const session = await this.sessionRepository.findOne({ where: { id } });
    if (!session) {
      throw new NotFoundException('Session non trouvée');
    }

    if (updateData.startTime && !updateData.endTime) {
      updateData.endTime = this.calculateEndTime(updateData.startTime);
    }

    Object.assign(session, updateData);
    return this.sessionRepository.save(session);
  }

  private calculateEndTime(startTime: string): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes + 25);
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }

  async getUserBookings(userId: number): Promise<FreeTrialBooking[]> {
    return this.bookingRepository.find({
      where: { userId },
      relations: ['session'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async cancelBooking(bookingId: number, userId: number): Promise<void> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId, userId },
      relations: ['session'],
    });

    if (!booking) {
      throw new NotFoundException('Réservation non trouvée');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Cette réservation est déjà annulée');
    }

    // Update booking status
    booking.status = BookingStatus.CANCELLED;
    await this.bookingRepository.save(booking);

    // Decrement booked slots
    if (booking.session) {
      booking.session.bookedSlots = Math.max(
        0,
        booking.session.bookedSlots - 1,
      );
      await this.sessionRepository.save(booking.session);
    }
  }

  async reportBooking(bookingId: number, userId: number): Promise<void> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId, userId },
      relations: ['session'],
    });

    if (!booking) {
      throw new NotFoundException('Réservation non trouvée');
    }

    if (booking.status === BookingStatus.REPORTED) {
      throw new BadRequestException('Cette réservation est déjà reportée');
    }

    // Update booking status
    booking.status = BookingStatus.REPORTED;
    await this.bookingRepository.save(booking);

    // Decrement booked slots
    if (booking.session) {
      booking.session.bookedSlots = Math.max(
        0,
        booking.session.bookedSlots - 1,
      );
      await this.sessionRepository.save(booking.session);
    }
  }
}
