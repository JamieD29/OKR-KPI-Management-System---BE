import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserOkrSwaggerDto } from '../../okr/dto/okr-response.dto';

export class JobTitleOptionDto {
  @ApiProperty({ description: 'Giá trị enum (tiếng Việt).' })
  value: string;

  @ApiProperty({ description: 'Nhãn hiển thị.' })
  label: string;

  @ApiProperty({ description: 'Khóa enum TypeScript.' })
  key: string;
}

export class OkrTemplateSwaggerDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  departmentId?: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  positionId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  jobTitle?: string | null;

  @ApiPropertyOptional({ nullable: true })
  positionName?: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  createdByUserId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  createdByName?: string | null;

  @ApiProperty({
    type: 'array',
    items: { type: 'object', additionalProperties: true },
    description: 'Cây nhiệm vụ / điểm (JSONB).',
  })
  structure: unknown[];

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

export class RemoveOkrTemplateResponseDto {
  @ApiProperty({ example: true })
  success: boolean;
}

export class ApplyTemplateResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({
    description: 'Số bản **UserOkr** tạo được (user không tồn tại bị bỏ qua, không fail cả batch).',
  })
  count: number;

  @ApiProperty({ type: [UserOkrSwaggerDto] })
  data: UserOkrSwaggerDto[];
}
