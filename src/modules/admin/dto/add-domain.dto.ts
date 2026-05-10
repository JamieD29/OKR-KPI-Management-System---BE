import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AddDomainDto {
  @ApiProperty({
    example: 'example.com',
    description: 'Tên miền cần thêm; duy nhất trong bảng `allowed_domains`.',
  })
  @IsString()
  @IsNotEmpty()
  domain: string;
}
