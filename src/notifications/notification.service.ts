import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async createNotification(
    userId: number,
    data: {
      title: string;
      message: string;
      type: NotificationType;
      metadata?: any;
    },
  ) {
    const notification = this.notificationRepository.create({
      userId,
      ...data,
    });
    return await this.notificationRepository.save(notification);
  }

  async getNotificationsForUser(userId: number) {
    return await this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: string, userId: number) {
    await this.notificationRepository.update({ id, userId }, { isRead: true });
  }

  async markAllAsRead(userId: number) {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );
  }

  async getUnreadCount(userId: number) {
    return await this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }
}
