import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FreeTrialSession } from './entities/free-trial-session.entity';
import {
  FreeTrialBooking,
  BookingStatus,
} from './entities/free-trial-booking.entity';
import { MailerService } from '../auth/services/mailer.service';
import { User } from '../users/user.entity';
import { AvailabilityService } from '../bookings/services/availability.service';
import { NotificationService } from '../notifications/notification.service';
import { NotificationType } from '../notifications/notification.entity';
import { UserRole } from '../users/enums/user-role.enum';

@Injectable()
export class FreeTrialService {
  constructor(
    @InjectRepository(FreeTrialSession)
    private sessionRepository: Repository<FreeTrialSession>,
    @InjectRepository(FreeTrialBooking)
    private bookingRepository: Repository<FreeTrialBooking>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private availabilityService: AvailabilityService,
    private mailerService: MailerService,
    private notificationService: NotificationService,
  ) {}

  // Admin methods removed as they are no longer needed (do like in booking)

  async bookSession(
    userId: number,
    sessionId: number,
    kidId?: string,
    teacherId?: number,
  ): Promise<FreeTrialBooking> {
    const session = await this.getSessionOrFail(sessionId);

    this.ensureFreeTrialSession(session);
    this.ensureSessionHasCapacity(session);

    const isAvailable = await this.availabilityService.isSlotAvailable(
      session.date,
      session.startTime.substring(0, 5),
    );

    if (!isAvailable) {
      throw new BadRequestException('Ce créneau n’est plus disponible');
    }

    const user = await this.getUserOrFail(userId, true);

    await this.validateTrialEligibility(userId, kidId);

    const booking = this.bookingRepository.create({
      userId,
      sessionId,
      kidId,
      status: BookingStatus.CONFIRMED,
      teacherId,
    });

    const savedBooking = await this.bookingRepository.save(booking);

    session.bookedSlots += 1;
    await this.sessionRepository.save(session);

    await this.sendConfirmationEmail(user, session, kidId);

    return savedBooking;
  }

  async bookByDateTime(
    userId: number,
    date: string,
    startTime: string,
    kidId?: string,
  ): Promise<FreeTrialBooking> {
    const normalizedTime = this.normalizeTime(startTime);

    const isAvailable = await this.availabilityService.isSlotAvailable(
      date,
      normalizedTime,
    );

    if (!isAvailable) {
      throw new BadRequestException('Ce créneau n’est plus disponible');
    }

    let session = await this.sessionRepository.findOne({
      where: {
        date,
        startTime: normalizedTime,
        type: 'FREE_TRIAL',
      },
    });

    if (!session) {
      session = this.sessionRepository.create({
        date,
        startTime: normalizedTime,
        endTime: this.calculateEndTime(normalizedTime),
        capacity: 10,
        type: 'FREE_TRIAL',
        isActive: true,
        bookedSlots: 0,
      });

      session = await this.sessionRepository.save(session);
    }

    return this.bookSession(userId, session.id, kidId);
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
    await this.updateBookingStatusAndReleaseSlot(
      bookingId,
      userId,
      BookingStatus.CANCELLED,
      'Cette réservation est déjà annulée',
    );
  }

  async reportBooking(bookingId: number, userId: number): Promise<void> {
    await this.updateBookingStatusAndReleaseSlot(
      bookingId,
      userId,
      BookingStatus.REPORTED,
      'Cette réservation est déjà reportée',
    );
  }

  private async updateBookingStatusAndReleaseSlot(
    bookingId: number,
    userId: number,
    nextStatus: BookingStatus,
    alreadyMessage: string,
  ): Promise<void> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId, userId },
      relations: ['session'],
    });

    if (!booking) {
      throw new NotFoundException('Réservation non trouvée');
    }

    if (booking.status === nextStatus) {
      throw new BadRequestException(alreadyMessage);
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException(
        'Seule une réservation confirmée peut être modifiée',
      );
    }

    booking.status = nextStatus;
    await this.bookingRepository.save(booking);

    if (booking.session) {
      booking.session.bookedSlots = Math.max(
        0,
        (booking.session.bookedSlots || 0) - 1,
      );
      await this.sessionRepository.save(booking.session);
    }

    // Notify Admins and assigned teacher
    const type =
      nextStatus === BookingStatus.CANCELLED
        ? NotificationType.BOOKING_CANCELLED
        : NotificationType.BOOKING_REPORTED;
    const actionLabel =
      nextStatus === BookingStatus.CANCELLED ? 'annulé' : 'reporté';

    await this.notifyAdminsAndTeacher(
      booking,
      type,
      `Cours d'essai ${actionLabel} - ${booking.id}`,
      `L'élève a ${actionLabel} son cours d'essai du ${booking.session?.date} à ${booking.session?.startTime}.`,
    );
  }

  private async notifyAdminsAndTeacher(
    booking: FreeTrialBooking,
    type: NotificationType,
    title: string,
    message: string,
  ) {
    const admins = await this.userRepository.find({
      where: { role: UserRole.ADMIN },
    });

    const notifications = admins.map((admin) =>
      this.notificationService.createNotification(admin.id, {
        title,
        message,
        type,
        metadata: { bookingId: booking.id, bookingType: 'FREE_TRIAL' },
      }),
    );

    if (booking.teacherId) {
      notifications.push(
        this.notificationService.createNotification(booking.teacherId, {
          title,
          message,
          type,
          metadata: { bookingId: booking.id, bookingType: 'FREE_TRIAL' },
        }),
      );
    }

    await Promise.all(notifications);
  }

  private async validateTrialEligibility(
    userId: number,
    kidId?: string,
  ): Promise<void> {
    const existingBookings = await this.bookingRepository.find({
      where: { userId, status: BookingStatus.CONFIRMED },
      relations: ['session'],
    });

    const confirmedTrials = existingBookings.filter(
      (booking) => booking.session?.type === 'FREE_TRIAL',
    );

    if (kidId) {
      const alreadyUsedByKid = confirmedTrials.some(
        (booking) => booking.kidId === kidId,
      );

      if (alreadyUsedByKid) {
        throw new BadRequestException(
          "Cet enfant a déjà fait un cours d'essai",
        );
      }

      return;
    }

    if (confirmedTrials.length > 0) {
      throw new BadRequestException("Vous avez déjà réservé un cours d'essai");
    }
  }

  private async sendConfirmationEmail(
    user: User,
    session: FreeTrialSession,
    kidId?: string,
  ): Promise<void> {
    try {
      if (!user?.email) return;

      let userName = 'Parent';

      if (kidId && user.kids?.length) {
        const kid = user.kids.find((k) => k.id === kidId);
        if (kid) {
          userName = kid.name;
        }
      } else if (user.kids?.length) {
        userName = user.kids[0].name;
      }

      await this.mailerService.sendBookingConfirmation(user.email, userName, {
        date: session.date,
        startTime: session.startTime,
        endTime: session.endTime,
      });
    } catch (error) {
      console.error('Failed to send booking confirmation email:', error);
    }
  }

  private async getSessionOrFail(id: number): Promise<FreeTrialSession> {
    const session = await this.sessionRepository.findOne({
      where: { id },
    });

    if (!session) {
      throw new NotFoundException('Session non trouvée');
    }

    return session;
  }

  private async getUserOrFail(userId: number, withKids = false): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: withKids ? ['kids'] : [],
    });

    if (!user) {
      throw new BadRequestException('Utilisateur non trouvé');
    }

    return user;
  }

  private ensureFreeTrialSession(session: FreeTrialSession): void {
    if (session.type !== 'FREE_TRIAL') {
      throw new BadRequestException(
        "Cette session n'est pas une session d'essai",
      );
    }

    if (!session.isActive) {
      throw new BadRequestException('Cette session est inactive');
    }
  }

  private ensureSessionHasCapacity(session: FreeTrialSession): void {
    if ((session.bookedSlots || 0) >= session.capacity) {
      throw new BadRequestException('Session complète');
    }
  }

  private normalizeTime(time: string): string {
    return time.substring(0, 5);
  }

  private toDateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private calculateEndTime(startTime: string): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes + 25, 0, 0);

    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');

    return `${h}:${m}`;
  }

  async updateClassroomStatus(
    bookingId: string | number,
    update: {
      isKidWaiting?: boolean;
      isKidAccepted?: boolean;
      isTeacherInClass?: boolean;
    },
  ): Promise<FreeTrialBooking> {
    const id =
      typeof bookingId === 'string'
        ? parseInt(bookingId.split('_').pop() || '', 10)
        : bookingId;

    const booking = await this.bookingRepository.findOne({ where: { id } });
    if (!booking) throw new NotFoundException('Réservation non trouvée');

    Object.assign(booking, update);
    return this.bookingRepository.save(booking);
  }

  async getClassroomStatus(
    bookingId: string | number,
  ): Promise<FreeTrialBooking> {
    const id =
      typeof bookingId === 'string'
        ? parseInt(bookingId.split('_').pop() || '', 10)
        : bookingId;

    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['session', 'kid', 'lesson'],
    });
    if (!booking) throw new NotFoundException('Réservation non trouvée');
    return booking;
  }

  async updateInteractionData(
    bookingId: string | number,
    interactionData: string,
  ): Promise<FreeTrialBooking> {
    const id =
      typeof bookingId === 'string'
        ? parseInt(bookingId.split('_').pop() || '', 10)
        : bookingId;
    await this.bookingRepository.update(id, { interactionData });
    return this.getClassroomStatus(id);
  }
}
