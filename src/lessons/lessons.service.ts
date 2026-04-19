import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Unit } from './entities/unit.entity';
import { Lesson } from './entities/lesson.entity';
import { KidLevel } from '../kids/enums/kid-level.enum';
import { Level as LevelEntity } from './entities/level.entity';
import { LevelRule } from './entities/level-rule.entity';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import {
  Subscription,
  SubscriptionStatus,
} from '../subscriptions/entities/subscription.entity';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { CreateUnitDto } from './dto/create-unit.dto';
import { LessonType } from './enums/lesson-type.enum';
import { MinioService } from '../minio/minio.service';
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
    @InjectRepository(LevelEntity)
    private readonly levelRepository: Repository<LevelEntity>,
    @InjectRepository(LevelRule)
    private readonly levelRuleRepository: Repository<LevelRule>,
    private readonly minioService: MinioService,
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

    const suggestedLesson = await this.getSuggestedLesson(kidId, level);

    if (activeSubscription) {
      return {
        units: units.map((unit) => ({
          ...unit,
          lessons: unit.lessons.map((lesson) => ({
            ...lesson,
            isLocked: false,
          })),
        })),
        suggestedLessonId: suggestedLesson?.id || null,
      };
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
    const mappedUnits = units.map((unit) => ({
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

    return {
      units: mappedUnits,
      suggestedLessonId: suggestedLesson?.id || null,
    };
  }

  async getSuggestedLesson(
    kidId: string,
    level: KidLevel,
  ): Promise<{ id: string; title: string; order: number } | null> {
    try {
      // 1. Get all lessons for this level
      const units = await this.getUnitsByLevel(level);
      const allLessons = units.flatMap((u) => u.lessons);

      if (allLessons.length === 0) return null;

      // 2. Check for assigned lesson in the NEXT upcoming session
      // Regular
      const nextRegular = await this.bookingRepository.findOne({
        where: { kidId, status: BookingStatus.SCHEDULED },
        order: { sessionDate: 'ASC', startTime: 'ASC' },
        relations: ['lesson'],
      });

      // Trial
      const nextTrial = await this.trialBookingRepository.findOne({
        where: { kidId, status: TrialBookingStatus.CONFIRMED },
        relations: ['session', 'lesson'],
        // We can't order trial bookings easily by session date in findOne here without more joins,
        // but typically there's only one active trial.
      });

      // Compare dates to find the EARLIEST upcoming session
      let earliestNext: Booking | FreeTrialBooking | null = null;

      if (nextRegular && nextTrial && nextTrial.session) {
        const dateRegStr =
          nextRegular.sessionDate instanceof Date
            ? nextRegular.sessionDate.toISOString().split('T')[0]
            : nextRegular.sessionDate;
        const dateReg = new Date(`${dateRegStr}T${nextRegular.startTime}`);
        const dateTrial = new Date(
          `${nextTrial.session.date}T${nextTrial.session.startTime}`,
        );
        earliestNext = dateReg < dateTrial ? nextRegular : nextTrial;
      } else {
        earliestNext = nextRegular || nextTrial;
      }

      if (earliestNext && earliestNext.lessonId) {
        const lesson = await this.lessonRepository.findOneBy({
          id: earliestNext.lessonId,
        });
        if (lesson) {
          return { id: lesson.id, title: lesson.title, order: lesson.order };
        }
      }

      // 3. If no session assigned, find the first non-completed lesson
      const [regularCompleted, trialCompleted] = await Promise.all([
        this.bookingRepository.find({
          where: { kidId, status: BookingStatus.COMPLETED },
          select: ['lessonId'],
        }),
        this.trialBookingRepository.find({
          where: { kidId, status: TrialBookingStatus.COMPLETED },
          select: ['lessonId'],
        }),
      ]);

      const completedLessonIds = new Set(
        [...regularCompleted, ...trialCompleted]
          .map((b) => b.lessonId)
          .filter((id) => !!id),
      );

      const nextLesson = allLessons.find((l) => !completedLessonIds.has(l.id));

      if (nextLesson) {
        return {
          id: nextLesson.id,
          title: nextLesson.title,
          order: nextLesson.order,
        };
      }

      return null;
    } catch (error) {
      console.error('Error calculating suggested lesson:', error);
      return null;
    }
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

  async deleteLesson(id: string): Promise<void> {
    const lesson = await this.lessonRepository.findOneBy({ id });
    if (!lesson) throw new NotFoundException('Lesson not found');
    await this.lessonRepository.remove(lesson);
  }

  async uploadThumbnail(
    id: string,
    file: Express.Multer.File,
  ): Promise<{ thumbnailUrl: string }> {
    const lesson = await this.lessonRepository.findOneBy({ id });
    if (!lesson) throw new NotFoundException('Lesson not found');

    if (!process.env.MINIO_BUCKET_NAME_LESSONS_THUMBNAILS) {
      throw new Error('MINIO_BUCKET_NAME_LESSONS_THUMBNAILS is not defined');
    }

    const bucketName = this.sanitizeBucketName(
      process.env.MINIO_BUCKET_NAME_LESSONS_THUMBNAILS,
    );
    const fileName = `thumbnail-${Date.now()}.${file.originalname.split('.').pop()}`;

    await this.minioService.uploadFile(
      bucketName,
      fileName,
      file.buffer,
      file.mimetype,
    );

    const url = await this.minioService.getFileUrl(bucketName, fileName);
    lesson.thumbnailUrl = url;
    await this.lessonRepository.save(lesson);

    return { thumbnailUrl: url };
  }

  private sanitizeBucketName(name: string): string {
    return (
      name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'lesson-thumbnail'
    );
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
    const { levelId, ...rest } = createUnitDto;
    const unit = this.unitRepository.create(rest as Partial<Unit>);

    if (levelId) {
      const level = await this.levelRepository.findOne({
        where: { id: levelId },
      });
      if (!level) throw new NotFoundException('Level not found');
      unit.levelEntity = level;
    }

    return await this.unitRepository.save(unit);
  }

  async updateUnit(id: string, dto: Partial<Unit>): Promise<Unit> {
    const unit = await this.unitRepository.findOne({ where: { id } });
    if (!unit) throw new NotFoundException('Unit not found');
    Object.assign(unit, dto);
    return await this.unitRepository.save(unit);
  }

  async deleteUnit(id: string): Promise<void> {
    await this.unitRepository.delete(id);
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
          type: LessonType.GENIALLY,
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

  // ─── Levels ──────────────────────────────────────────────────────────────────

  async getLevels(): Promise<LevelEntity[]> {
    return await this.levelRepository.find({ order: { order: 'ASC' } });
  }

  async createLevel(dto: Partial<LevelEntity>): Promise<LevelEntity> {
    const level = this.levelRepository.create(dto);
    return await this.levelRepository.save(level);
  }

  async updateLevel(
    id: string,
    dto: Partial<LevelEntity>,
  ): Promise<LevelEntity> {
    const level = await this.levelRepository.findOne({ where: { id } });
    if (!level) throw new NotFoundException('Level not found');
    Object.assign(level, dto);
    const savedLevel = await this.levelRepository.save(level);
    return savedLevel;
  }

  async deleteLevel(id: string): Promise<void> {
    await this.levelRepository.delete(id);
  }

  // ─── Level Rules ─────────────────────────────────────────────────────────────

  async getLevelRules(): Promise<LevelRule[]> {
    return await this.levelRuleRepository.find({ order: { priority: 'ASC' } });
  }

  async createLevelRule(dto: Partial<LevelRule>): Promise<LevelRule> {
    const rule = this.levelRuleRepository.create(dto);
    return await this.levelRuleRepository.save(rule);
  }

  async updateLevelRule(
    id: string,
    dto: Partial<LevelRule>,
  ): Promise<LevelRule> {
    const rule = await this.levelRuleRepository.findOne({ where: { id } });
    if (!rule) throw new NotFoundException('Rule not found');
    Object.assign(rule, dto);
    return await this.levelRuleRepository.save(rule);
  }

  async deleteLevelRule(id: string): Promise<void> {
    await this.levelRuleRepository.delete(id);
  }
}
