import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../database/entities/notification.entity';

/**
 * Service handling user notifications, including notification creation,
 * fetching unread notifications, fetching recent notification history,
 * and updating read status.
 */
@Injectable()
export class NotificationService {
  /**
   * @param notificationRepository Repository for Notification entity
   */
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  /**
   * Creates and saves a new unread notification for a user.
   * 
   * @param userId The ID of the recipient user
   * @param message The text content of the notification
   * @returns The saved Notification entity
   */
  async create(userId: string, message: string) {
    const notification = this.notificationRepository.create({
      userId,
      message,
      isRead: false,
    });
    return this.notificationRepository.save(notification);
  }

  /**
   * Retrieves all unread notifications for a specific user,
   * ordered by creation date descending.
   * 
   * @param userId The ID of the user
   * @returns Array of unread notifications
   */
  async getUnread(userId: string) {
    return this.notificationRepository.find({
      where: { userId, isRead: false },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Retrieves the 50 most recent notifications (both read and unread) for a specific user,
   * ordered by creation date descending.
   * 
   * @param userId The ID of the user
   * @returns Array of notifications
   */
  async getAll(userId: string) {
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  /**
   * Marks a specific notification belonging to a user as read.
   * 
   * @param id The ID of the notification
   * @param userId The ID of the user owning the notification
   * @returns The updated Notification entity, or null if not found
   */
  async markAsRead(id: string, userId: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });
    if (!notification) return null;

    notification.isRead = true;
    return this.notificationRepository.save(notification);
  }

  /**
   * Marks all unread notifications for a specific user as read in bulk.
   * 
   * @param userId The ID of the user
   * @returns A success message
   */
  async markAllAsRead(userId: string) {
    await this.notificationRepository.update({ userId, isRead: false }, { isRead: true });
    return { message: 'Đã đánh dấu tất cả đã đọc' };
  }
}
