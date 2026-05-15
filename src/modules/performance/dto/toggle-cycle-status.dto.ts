import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { EvaluationStatus } from '../../../database/entities/performance/evaluation-cycle.entity';

export class ToggleCycleStatusDto {
  @ApiProperty({
    enum: EvaluationStatus,
    description: 'Trạng thái mới (*OPEN*, *CLOSED*, *ARCHIVED*, …).',
    example: EvaluationStatus.OPEN,
  })
  @IsEnum(EvaluationStatus)
  status: EvaluationStatus;
}
