import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Unit } from './entities/unit.entity';
import { Lesson } from './entities/lesson.entity';
import { KidLevel } from '../kids/kid.entity';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import {
  Subscription,
  SubscriptionStatus,
} from '../subscriptions/entities/subscription.entity';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { CreateUnitDto } from './dto/create-unit.dto';
import {
  FreeTrialBooking,
  BookingStatus as TrialBookingStatus,
} from '../free-trial/entities/free-trial-booking.entity';

@Injectable()
export class LessonsService {
  constructor(
    @InjectRepository(Unit)
    private readonly unitRepository: Repository<Unit>,
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(FreeTrialBooking)
    private readonly trialBookingRepository: Repository<FreeTrialBooking>,
  ) {}

  async isKidEnrolled(kidId: string): Promise<boolean> {
    const activeSubscription = await this.subscriptionRepository.findOne({
      where: { kidId, status: SubscriptionStatus.ACTIVE },
    });

    if (activeSubscription) return true;

    const hasBookings = await this.bookingRepository.findOne({
      where: [
        { kidId, status: BookingStatus.SCHEDULED },
        { kidId, status: BookingStatus.COMPLETED },
      ],
    });

    if (hasBookings) return true;

    const hasTrialBooking = await this.trialBookingRepository.findOne({
      where: { kidId, status: TrialBookingStatus.CONFIRMED },
    });

    return !!hasTrialBooking;
  }

  async getUnitsByLevel(level: KidLevel): Promise<Unit[]> {
    return await this.unitRepository.find({
      where: { level },
      relations: ['lessons'],
      order: {
        order: 'ASC',
        lessons: {
          order: 'ASC',
        },
      },
    });
  }

  async getLessonsByKidAndLevel(kidId: string, level: KidLevel) {
    const units = await this.getUnitsByLevel(level);

    // 1. Check for active subscription (full access)
    const activeSubscription = await this.subscriptionRepository.findOne({
      where: { kidId, status: SubscriptionStatus.ACTIVE },
    });

    if (activeSubscription) {
      return units.map((unit) => ({
        ...unit,
        lessons: unit.lessons.map((lesson) => ({
          ...lesson,
          isLocked: false,
        })),
      }));
    }

    // 2. Otherwise, unlock N lessons based on booking count
    const regularBookingCount = await this.bookingRepository.count({
      where: [
        { kidId, status: BookingStatus.SCHEDULED },
        { kidId, status: BookingStatus.COMPLETED },
      ],
    });

    const trialBookingCount = await this.trialBookingRepository.count({
      where: { kidId, status: TrialBookingStatus.CONFIRMED },
    });

    const totalBookingCount = regularBookingCount + trialBookingCount;

    let unlockedCount = 0;
    return units.map((unit) => ({
      ...unit,
      lessons: unit.lessons.map((lesson) => {
        const isLocked = unlockedCount >= totalBookingCount;
        unlockedCount++;
        return {
          ...lesson,
          isLocked,
        };
      }),
    }));
  }

  async getLessonById(id: string): Promise<Lesson> {
    const lesson = await this.lessonRepository.findOne({
      where: { id },
      relations: ['unit'],
    });
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }
    return lesson;
  }

  async updateLesson(
    id: string,
    updateDto: Partial<{
      title: string;
      type: string;
      content: string;
      order: number;
      unitId: string;
    }>,
  ): Promise<Lesson> {
    const lesson = await this.getLessonById(id);

    if (updateDto.unitId && updateDto.unitId !== lesson.unit?.id) {
      const unit = await this.unitRepository.findOne({
        where: { id: updateDto.unitId },
      });
      if (!unit) throw new NotFoundException('Unit not found');
      lesson.unit = unit;
    }

    Object.assign(lesson, {
      ...(updateDto.title !== undefined && { title: updateDto.title }),
      ...(updateDto.type !== undefined && { type: updateDto.type }),
      ...(updateDto.content !== undefined && { content: updateDto.content }),
      ...(updateDto.order !== undefined && { order: updateDto.order }),
    });

    return await this.lessonRepository.save(lesson);
  }

  async createLesson(createLessonDto: CreateLessonDto): Promise<Lesson> {
    const unit = await this.unitRepository.findOne({
      where: { id: createLessonDto.unitId },
    });
    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    const lesson = this.lessonRepository.create({
      ...createLessonDto,
      unit,
    });

    return await this.lessonRepository.save(lesson);
  }

  async createLessonsBulk(lessons: CreateLessonDto[]): Promise<Lesson[]> {
    const unitIds = [...new Set(lessons.map((l) => l.unitId))];
    const units = await this.unitRepository.find({
      where: { id: In(unitIds) },
    });
    const unitMap = new Map(units.map((u) => [u.id, u]));

    const lessonEntities = lessons.map((dto) => {
      const unit = unitMap.get(dto.unitId);
      if (!unit) {
        throw new NotFoundException(`Unit with ID ${dto.unitId} not found`);
      }
      return this.lessonRepository.create({
        ...dto,
        unit,
      });
    });

    return await this.lessonRepository.save(lessonEntities);
  }

  async createUnit(createUnitDto: CreateUnitDto): Promise<Unit> {
    const unit = this.unitRepository.create(createUnitDto);
    return await this.unitRepository.save(unit);
  }

  async seedLevel(
    level: KidLevel,
    unitCount = 7,
    lessonsPerUnit = 4,
  ): Promise<Unit[]> {
    // Check if units for this level already exist
    const existingUnits = await this.unitRepository.find({ where: { level } });
    if (existingUnits.length > 0) {
      throw new Error(
        `Level ${level} already has ${existingUnits.length} unit(s). Delete them first.`,
      );
    }

    const createdUnits: Unit[] = [];

    for (let unitIndex = 1; unitIndex <= unitCount; unitIndex++) {
      // Create the unit
      const unit = this.unitRepository.create({
        title: `Unit ${unitIndex}`,
        level,
        order: unitIndex,
      });
      const savedUnit = await this.unitRepository.save(unit);

      // Create lessons for this unit
      const lessonEntities = Array.from({ length: lessonsPerUnit }, (_, i) => {
        const lessonIndex = i + 1;
        return this.lessonRepository.create({
          title: `Lesson ${lessonIndex}`,
          type: 'genially',
          content: '',
          order: lessonIndex,
          unit: savedUnit,
        });
      });

      const savedLessons = await this.lessonRepository.save(lessonEntities);
      savedUnit.lessons = savedLessons;
      createdUnits.push(savedUnit);
    }

    return createdUnits;
  }
}
