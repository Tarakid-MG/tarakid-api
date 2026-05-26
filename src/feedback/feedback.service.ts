import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import { User } from '../users/user.entity';
import { UserRole } from '../users/enums/user-role.enum';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { Feedback } from './entities/feedback.entity';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private readonly feedbackRepository: Repository<Feedback>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  async create(
    dto: CreateFeedbackDto,
    user: { id: number; role: string },
  ): Promise<Feedback> {
    if (user.role !== UserRole.CLIENT) {
      throw new ForbiddenException('Only clients can submit lesson feedback');
    }

    const booking = await this.bookingRepository.findOne({
      where: { id: dto.bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.userId !== user.id) {
      throw new ForbiddenException('You cannot submit feedback for this booking');
    }

    const alreadySubmitted = await this.feedbackRepository.exist({
      where: { bookingId: dto.bookingId },
    });

    if (alreadySubmitted) {
      throw new ConflictException('Feedback already submitted for this booking');
    }

    const feedback = this.feedbackRepository.create({
      bookingId: dto.bookingId,
      rating: dto.rating,
      comment: dto.comment?.trim() || null,
    });

    return await this.feedbackRepository.save(feedback);
  }

  async findAll(): Promise<any[]> {
    const rows = await this.feedbackRepository
      .createQueryBuilder('feedback')
      .leftJoin('feedback.booking', 'booking')
      .leftJoin('booking.kid', 'kid')
      .leftJoin('booking.user', 'parent')
      .leftJoin(User, 'teacher', 'teacher.id = booking.teacherId')
      .leftJoin('booking.lesson', 'lesson')
      .select([
        'feedback.id AS id',
        'feedback.bookingId AS bookingId',
        'feedback.rating AS rating',
        'feedback.comment AS comment',
        'feedback.isRead AS isRead',
        'feedback.createdAt AS createdAt',
        'booking.sessionDate AS sessionDate',
        'booking.startTime AS startTime',
        'booking.endTime AS endTime',
        'booking.status AS bookingStatus',
        'lesson.title AS lessonTitle',
        'kid.id AS kidId',
        'kid.name AS kidName',
        'kid.level AS kidLevel',
        'parent.id AS parentId',
        'parent.firstName AS parentFirstName',
        'parent.lastName AS parentLastName',
        'parent.email AS parentEmail',
        'teacher.id AS teacherId',
        'teacher.firstName AS teacherFirstName',
        'teacher.lastName AS teacherLastName',
        'teacher.email AS teacherEmail',
      ])
      .orderBy('feedback.createdAt', 'DESC')
      .getRawMany();

    return rows.map((row) => ({
      id: row.id,
      bookingId: row.bookingId,
      rating: row.rating,
      comment: row.comment,
      isRead: Boolean(row.isRead),
      createdAt: row.createdAt,
      booking: {
        sessionDate: row.sessionDate,
        startTime: row.startTime,
        endTime: row.endTime,
        status: row.bookingStatus,
        lessonTitle: row.lessonTitle,
      },
      kid: row.kidId
        ? {
            id: row.kidId,
            name: row.kidName,
            level: row.kidLevel,
          }
        : null,
      parent: row.parentId
        ? {
            id: Number(row.parentId),
            firstName: row.parentFirstName,
            lastName: row.parentLastName,
            email: row.parentEmail,
          }
        : null,
      teacher: row.teacherId
        ? {
            id: Number(row.teacherId),
            firstName: row.teacherFirstName,
            lastName: row.teacherLastName,
            email: row.teacherEmail,
          }
        : null,
    }));
  }

  async getUnreadCount(): Promise<number> {
    return await this.feedbackRepository.count({ where: { isRead: false } });
  }

  async markAllAsRead(): Promise<void> {
    await this.feedbackRepository.update({ isRead: false }, { isRead: true });
  }
}
