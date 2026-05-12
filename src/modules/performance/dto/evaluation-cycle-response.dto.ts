import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  EvaluationStatus,
  CycleType,
} from '../../../database/entities/performance/evaluation-cycle.entity';

/** Bản ghi `EvaluationCycle` trả về API. */
export class EvaluationCycleSwaggerDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Học kỳ 1 - 2025-2026' })
  name: string;

  @ApiProperty({ enum: EvaluationStatus })
  status: EvaluationStatus;

  @ApiProperty({ enum: CycleType })
  type: CycleType;

  @ApiPropertyOptional({ type: String, format: 'date', nullable: true })
  startDate?: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date', nullable: true })
  endDate?: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

export class ToggleCycleStatusResponseDto {
  @ApiProperty({ example: 'Cập nhật thành công' })
  message: string;

  @ApiProperty({ type: EvaluationCycleSwaggerDto })
  cycle: EvaluationCycleSwaggerDto;

  @ApiProperty({
    description: '`true` nếu `endDate` (chỉnh về 00:00) nhỏ hơn hôm nay — FE có thể cảnh báo.',
  })
  isPast: boolean;
}
