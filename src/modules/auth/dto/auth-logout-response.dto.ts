import { ApiProperty } from '@nestjs/swagger';

export class AuthLogoutResponseDto {
  @ApiProperty({
    example: 'Đăng xuất thành công',
    description: 'Thông báo kết quả. JWT không bị revoke phía server — FE tự xóa token.',
  })
  message: string;
}
