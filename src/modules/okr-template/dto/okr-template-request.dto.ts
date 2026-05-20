import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateOkrTemplateDto {
  @ApiProperty({ example: 'Mẫu OKR giảng viên' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  departmentId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'UUID **management_positions.id**.' })
  @IsOptional()
  @IsUUID('4')
  positionId?: string;

  @ApiPropertyOptional({
    description: 'Chức danh nghề nghiệp (chuỗi enum **JobTitle**, tiếng Việt).',
  })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiPropertyOptional({ example: 'Phó khoa' })
  @IsOptional()
  @IsString()
  positionName?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  createdByUserId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  createdByName?: string;

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'object', additionalProperties: true },
    description:
      'Cây nhiệm vụ (JSON). Nếu có phần tử: **tổng maxScore ở gốc phải = 100** (validate service).',
  })
  @IsOptional()
  @IsArray()
  structure?: Record<string, unknown>[];
}

export class UpdateOkrTemplateDto extends PartialType(CreateOkrTemplateDto) {}

export class ApplyTemplateDto {
  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Danh sách user nhận OKR (ít nhất 1).',
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Phải chọn ít nhất 1 người để giao OKR' })
  @IsUUID('4', { each: true })
  userIds: string[];

  @ApiProperty({ format: 'uuid', description: 'UUID **evaluation_cycles.id**.' })
  @IsUUID('4')
  cycleId: string;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Hạn chót (ISO). Lưu DB dạng timestamp.',
  })
  @IsOptional()
  @IsDateString()
  deadline?: string;
}
