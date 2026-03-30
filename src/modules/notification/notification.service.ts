import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../database/entities/notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  // Tạo thông báo mới
  async create(userId: string, message: string) {
    const notification = this.notificationRepository.create({
      userId,
      message,
      isRead: false,
    });
    return this.notificationRepository.save(notification);
  }

  // Lấy thông báo chưa đọc của user
  async getUnread(userId: string) {
    return this.notificationRepository.find({
      where: { userId, isRead: false },
      order: { createdAt: 'DESC' },
    });
  }

  // Lấy tất cả thông báo của user (giới hạn 50)
  async getAll(userId: string) {
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  // Đánh dấu đã đọc
  async markAsRead(id: string, userId: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });
    if (!notification) return null;

    notification.isRead = true;
    return this.notificationRepository.save(notification);
  }

  // Đánh dấu tất cả đã đọc
  async markAllAsRead(userId: string) {
    await this.notificationRepository.update({ userId, isRead: false }, { isRead: true });
    return { message: 'Đã đánh dấu tất cả đã đọc' };
  }
}
