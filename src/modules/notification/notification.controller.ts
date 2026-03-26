import { Controller, Get, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // GET /notifications — Lấy thông báo chưa đọc của user hiện tại
  @Get()
  getUnread(@Req() req) {
    return this.notificationService.getUnread(req.user.id);
  }

  // GET /notifications/all — Lấy tất cả thông báo
  @Get('all')
  getAll(@Req() req) {
    return this.notificationService.getAll(req.user.id);
  }

  // PATCH /notifications/:id/read — Đánh dấu đã đọc
  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @Req() req) {
    return this.notificationService.markAsRead(id, req.user.id);
  }

  // PATCH /notifications/read-all — Đánh dấu tất cả đã đọc
  @Patch('read-all')
  markAllAsRead(@Req() req) {
    return this.notificationService.markAllAsRead(req.user.id);
  }
}
