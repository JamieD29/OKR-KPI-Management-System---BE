import { ApiProperty } from '@nestjs/swagger';

/** Phản hồi dạng `{ message: string }` (xóa domain, factory reset). */
export class AdminMessageResponseDto {
  @ApiProperty({
    example: 'Domain removed successfully',
    description: 'Thông báo kết quả; nội dung cụ thể tùy endpoint.',
  })
  message: string;
}
