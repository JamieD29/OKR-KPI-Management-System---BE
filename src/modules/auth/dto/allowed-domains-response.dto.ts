import { ApiProperty } from '@nestjs/swagger';

/** Một domain được phép — API chỉ trả field domain (select trong service). */
export class AllowedDomainItemDto {
  @ApiProperty({
    example: 'itec.hcmus.edu.vn',
    description: 'Tên miền email được phép đăng ký / đăng nhập',
  })
  domain: string;
}

export class AllowedDomainsResponseDto {
  @ApiProperty({
    type: [AllowedDomainItemDto],
    description: 'Danh sách domain được phép. Có thể rỗng nếu DB chưa có bản ghi.',
  })
  domains: AllowedDomainItemDto[];
}
