import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Subscription,
  SubscriptionStatus,
  CommitmentType,
} from './entities/subscription.entity';
import { User } from '../users/user.entity';
import { Kid } from '../kids/kid.entity';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Kid)
    private kidRepository: Repository<Kid>,
  ) {}

  async create(
    userId: number,
    createSubscriptionDto: CreateSubscriptionDto,
  ): Promise<Subscription> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Validate kid if provided
    if (createSubscriptionDto.kidId) {
      const kid = await this.kidRepository.findOne({
        where: { id: createSubscriptionDto.kidId, userId },
      });
      if (!kid) {
        throw new BadRequestException(
          'Enfant non trouvé ou ne vous appartient pas',
        );
      }
    }

    // Check for existing active subscription for this user/kid to "stack" dates
    const existingActive = await this.subscriptionRepository.findOne({
      where: {
        userId,
        kidId: createSubscriptionDto.kidId,
        status: SubscriptionStatus.ACTIVE,
      },
      order: { endDate: 'DESC' },
    });

    const baseDate =
      existingActive && existingActive.endDate > new Date()
        ? new Date(existingActive.endDate)
        : new Date();

    const startDate = baseDate;
    const endDate = new Date(startDate);
    let totalCredits = createSubscriptionDto.creditsPerMonth;

    switch (createSubscriptionDto.commitmentType) {
      case CommitmentType.MONTHLY:
        endDate.setMonth(endDate.getMonth() + 1);
        totalCredits = createSubscriptionDto.creditsPerMonth;
        break;
      case CommitmentType.THREE_MONTHS:
        endDate.setMonth(endDate.getMonth() + 3);
        totalCredits = createSubscriptionDto.creditsPerMonth * 3;
        break;
      case CommitmentType.SIX_MONTHS:
        endDate.setMonth(endDate.getMonth() + 6);
        totalCredits = createSubscriptionDto.creditsPerMonth * 6;
        break;
    }

    const subscription = this.subscriptionRepository.create({
      userId,
      kidId: createSubscriptionDto.kidId,
      planName: createSubscriptionDto.planName,
      frequency: createSubscriptionDto.frequency,
      commitmentType: createSubscriptionDto.commitmentType,
      creditsPerMonth: createSubscriptionDto.creditsPerMonth,
      totalCredits,
      remainingCredits: totalCredits,
      pricePerMonth: createSubscriptionDto.pricePerMonth,
      startDate,
      endDate,
      status: SubscriptionStatus.ACTIVE,
    });

    const savedSubscription =
      await this.subscriptionRepository.save(subscription);

    // Update user credits and plan
    if (user) {
      const oldCredits = user.credits || 0;
      user.credits = oldCredits + totalCredits;
      user.subscriptionPlan = createSubscriptionDto.planName;
      console.log(
        `[Subscription] Immediate activation for user ${user.id}: credits ${oldCredits} -> ${user.credits}`,
      );
      await this.userRepository.save(user);
    }

    return savedSubscription;
  }

  async activateSubscription(subscriptionId: string): Promise<Subscription> {
    console.log(`Activating subscription: ${subscriptionId}`);
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Abonnement non trouvé');
    }

    if (subscription.status === SubscriptionStatus.ACTIVE) {
      return subscription;
    }

    // Check for existing active subscription for this user/kid to "stack" dates
    const existingActive = await this.subscriptionRepository.findOne({
      where: {
        userId: subscription.userId,
        kidId: subscription.kidId,
        status: SubscriptionStatus.ACTIVE,
      },
      order: { endDate: 'DESC' },
    });

    subscription.status = SubscriptionStatus.ACTIVE;

    // If we have an active sub, start this one when that one ends
    const baseDate =
      existingActive && existingActive.endDate > new Date()
        ? new Date(existingActive.endDate)
        : new Date();

    subscription.startDate = baseDate;
    const endDate = new Date(subscription.startDate);
    switch (subscription.commitmentType) {
      case CommitmentType.MONTHLY:
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case CommitmentType.THREE_MONTHS:
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case CommitmentType.SIX_MONTHS:
        endDate.setMonth(endDate.getMonth() + 6);
        break;
    }
    subscription.endDate = endDate;

    const savedSubscription =
      await this.subscriptionRepository.save(subscription);

    // Update user credits
    const user = await this.userRepository.findOne({
      where: { id: subscription.userId },
    });
    if (user) {
      const oldCredits = user.credits || 0;
      user.credits = oldCredits + subscription.totalCredits;
      user.subscriptionPlan = subscription.planName;
      console.log(
        `User ${user.id} credits: ${oldCredits} -> ${user.credits} (added ${subscription.totalCredits})`,
      );
      await this.userRepository.save(user);
    } else {
      console.warn(
        `User ${subscription.userId} not found during subscription activation`,
      );
    }

    return savedSubscription;
  }

  async updateSessionId(id: string, sessionId: string): Promise<void> {
    await this.subscriptionRepository.update(id, {
      stripeSessionId: sessionId,
    });
  }

  async findByUser(userId: number): Promise<Subscription[]> {
    return this.subscriptionRepository.find({
      where: { userId },
      relations: ['kid'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByKid(kidId: string): Promise<Subscription[]> {
    return this.subscriptionRepository.find({
      where: { kidId, status: SubscriptionStatus.ACTIVE },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: number): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id, userId },
      relations: ['kid'],
    });

    if (!subscription) {
      throw new NotFoundException('Abonnement non trouvé');
    }

    return subscription;
  }

  async decrementCredits(
    subscriptionId: string,
    amount: number = 1,
  ): Promise<void> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Abonnement non trouvé');
    }

    if (subscription.remainingCredits < amount) {
      throw new BadRequestException('Crédits insuffisants');
    }

    subscription.remainingCredits -= amount;
    await this.subscriptionRepository.save(subscription);

    // Update user credits for backward compatibility
    const user = await this.userRepository.findOne({
      where: { id: subscription.userId },
    });
    if (user && user.credits > 0) {
      user.credits -= amount;
      await this.userRepository.save(user);
    }
  }

  async checkAndUpdateExpired(): Promise<void> {
    const now = new Date();
    await this.subscriptionRepository
      .createQueryBuilder()
      .update(Subscription)
      .set({ status: SubscriptionStatus.EXPIRED })
      .where('endDate < :now', { now })
      .andWhere('status = :active', { active: SubscriptionStatus.ACTIVE })
      .execute();
  }
}
