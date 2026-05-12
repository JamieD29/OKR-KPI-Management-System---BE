import { Controller, Get, Patch, Param, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
  ApiParam,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  NotificationItemDto,
  MarkAllNotificationsReadResponseDto,
} from './dto/notification-swagger.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description:
    'Thiếu `Authorization: Bearer <token>` hoặc JWT không hợp lệ / hết hạn.',
})
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({
    summary: 'Danh sách thông báo chưa đọc',
    description:
      'Trả về mảng notification với `isRead: false` của user trong JWT, sort `createdAt DESC`. Có thể rỗng.',
  })
  @ApiOkResponse({
    description: 'Mảng thông báo chưa đọc',
    type: NotificationItemDto,
    isArray: true,
  })
  @ApiInternalServerErrorResponse({ description: 'Lỗi DB.' })
  getUnread(@Req() req) {
    return this.notificationService.getUnread(req.user.id);
  }

  @Get('all')
  @ApiOperation({
    summary: 'Tất cả thông báo (giới hạn 50)',
    description:
      '`getAll`: mọi notification của user hiện tại, `createdAt DESC`, tối đa **50** bản ghi.',
  })
  @ApiOkResponse({
    description: 'Tối đa 50 thông báo gần nhất',
    type: NotificationItemDto,
    isArray: true,
  })
  @ApiInternalServerErrorResponse({ description: 'Lỗi DB.' })
  getAll(@Req() req) {
    return this.notificationService.getAll(req.user.id);
  }

  @Patch('read-all')
  @ApiOperation({
    summary: 'Đánh dấu tất cả thông báo đã đọc',
    description:
      'Bulk update mọi bản ghi `isRead: false` của user hiện tại thành `true`.',
  })
  @ApiOkResponse({
    description: 'Thông báo kết quả',
    type: MarkAllNotificationsReadResponseDto,
  })
  @ApiInternalServerErrorResponse({ description: 'Lỗi khi bulk update.' })
  markAllAsRead(@Req() req) {
    return this.notificationService.markAllAsRead(req.user.id);
  }

  @Patch(':id/read')
  @ApiOperation({
    summary: 'Đánh dấu một thông báo đã đọc',
    description:
      'Chỉ cập nhật khi `id` tồn tại và `userId` khớp JWT. Nếu không tìm thấy hoặc không thuộc user, **HTTP 200** với body JSON `null` (không trả 404).',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID notification.' })
  @ApiOkResponse({
    description:
      'Bản ghi notification sau update (`isRead: true`), hoặc `null` trong các trường hợp trên (schema mô tả khi có object).',
    type: NotificationItemDto,
  })
  @ApiInternalServerErrorResponse()
  markAsRead(@Param('id') id: string, @Req() req) {
    return this.notificationService.markAsRead(id, req.user.id);
  }
}
