import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';
import { CycleType } from '../../../database/entities/performance-evaluation/evaluation-cycle.entity';

export class CreateCycleDto {
  @ApiProperty({ example: 'Học kỳ 1 - 2025-2026' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    enum: CycleType,
    description:
      'Loại kỳ. Bỏ trống hoặc chuỗi rỗng → service dùng *OTHER*.',
  })
  @IsOptional()
  @IsEnum(CycleType)
  type?: CycleType;

  @ApiProperty({
    format: 'date',
    example: '2025-09-01',
    description: 'Phải ≥ ngày hôm nay (validation trong service).',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    format: 'date',
    example: '2026-01-31',
    description: 'Phải sau **startDate** (validation trong service).',
  })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({
    description: 'Bypass validation ngày bắt đầu quá khứ (dành cho kiểm thử/dev)',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  bypassValidation?: boolean;
}
