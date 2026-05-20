import { ApiProperty } from '@nestjs/swagger';

export class AdminDomainItemDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'itec.hcmus.edu.vn' })
  domain: string;

  @ApiProperty({ type: String, format: 'date-time' })
  addedAt: Date;

  @ApiProperty({
    example: 27,
    description: 'Số user có email thuộc domain đó (theo logic **findAll** admin).',
  })
  userCount: number;
}

export class AdminListDomainsResponseDto {
  @ApiProperty({ type: [AdminDomainItemDto] })
  domains: AdminDomainItemDto[];
}

export class AdminAllowedDomainRecordDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'example.com' })
  domain: string;

  @ApiProperty({ type: String, format: 'date-time' })
  addedAt: Date;
}

export class AdminCreateDomainResponseDto {
  @ApiProperty({ type: AdminAllowedDomainRecordDto })
  domain: AdminAllowedDomainRecordDto;
}
