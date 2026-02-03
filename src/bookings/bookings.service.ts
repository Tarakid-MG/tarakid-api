import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Booking, BookingStatus } from './entities/booking.entity';
import {
  Subscription,
  SubscriptionStatus,
} from '../subscriptions/entities/subscription.entity';
import { Kid } from '../kids/kid.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Kid)
    private kidRepository: Repository<Kid>,
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

    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new BadRequestException('Abonnement non actif');
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

    // Create bookings
    const bookings: Booking[] = [];
    for (const bookingSlot of createBookingDto.bookings) {
      const sessionDate = new Date(bookingSlot.sessionDate);
      const dayOfWeek = sessionDate.getDay();

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
    // Check if enough credits
    if (subscription.remainingCredits < requestedSlots.length) {
      throw new BadRequestException(
        `Crédits insuffisants. Vous avez ${subscription.remainingCredits} crédits restants.`,
      );
    }

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

  async cancelBooking(id: string, userId: number): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id, userId },
    });

    if (!booking) {
      throw new NotFoundException('Réservation non trouvée');
    }

    booking.status = BookingStatus.CANCELLED;
    await this.bookingRepository.save(booking);

    // Refund credit
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: booking.subscriptionId },
    });

    if (subscription) {
      subscription.remainingCredits += 1;
      await this.subscriptionRepository.save(subscription);
    }

    return booking;
  }
}
