import { ApiProperty } from '@nestjs/swagger';

export class NotificationItemDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  userId: string;

  @ApiProperty({
    example: 'Bạn đã được gán chức vụ Trưởng khoa',
    description: 'Nội dung thông báo (text).',
  })
  message: string;

  @ApiProperty({ description: 'Trạng thái đã đọc.' })
  isRead: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}

export class MarkAllNotificationsReadResponseDto {
  @ApiProperty({ example: 'Đã đánh dấu tất cả đã đọc' })
  message: string;
}
