import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EvaluationCycleSwaggerDto } from '../../performance/dto/evaluation-cycle-response.dto';

export class KeyResultSwaggerDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  target: number;

  @ApiProperty()
  current: number;

  @ApiProperty({ example: 'Bài' })
  unit: string;
}

export class ObjectiveSwaggerDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ example: 'DEPARTMENT' })
  type: string;

  @ApiProperty({ format: 'uuid' })
  cycleId: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  departmentId?: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  userId?: string | null;

  @ApiProperty()
  progress: number;

  @ApiProperty({ example: 'ON_TRACK' })
  status: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: [KeyResultSwaggerDto] })
  keyResults: KeyResultSwaggerDto[];
}

/** User tối thiểu trong các list OKR (relations); response thực tế có thể đầy đủ hơn. */
export class OkrUserBriefDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional({ nullable: true })
  name?: string | null;
}

export class UserOkrSwaggerDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  userId?: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  cycleId?: string | null;

  @ApiProperty({ example: 'Nâng cao năng lực nghiên cứu' })
  objective: string;

  @ApiProperty({
    description: 'Cây Key Results (JSONB) — có thể lồng `items`, `maxScore`, `unitScore`, …',
    type: 'array',
    items: { type: 'object', additionalProperties: true },
  })
  keyResults: unknown[];

  @ApiProperty()
  totalScore: number;

  @ApiPropertyOptional({ nullable: true })
  templateId?: string | null;

  @ApiProperty({
    example: 'ACCEPTED',
    description: 'PENDING | NEGOTIATING | ACCEPTED | SUBMITTED | COMPLETED | …',
  })
  status: string;

  @ApiPropertyOptional({
    nullable: true,
    type: 'object',
    additionalProperties: true,
    description: 'Chat / đề xuất chỉnh sửa theo `itemId`.',
  })
  proposedChanges?: Record<string, unknown> | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  deadline?: Date | null;

  @ApiPropertyOptional({
    nullable: true,
    type: 'object',
    additionalProperties: true,
  })
  selfReportData?: Record<string, unknown> | null;

  @ApiPropertyOptional({
    nullable: true,
    type: 'object',
    additionalProperties: true,
  })
  managerReportData?: Record<string, unknown> | null;

  @ApiPropertyOptional({ nullable: true })
  managerScore?: number | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;

  @ApiPropertyOptional({ type: OkrUserBriefDto })
  user?: OkrUserBriefDto;

  @ApiPropertyOptional({ type: EvaluationCycleSwaggerDto })
  cycle?: EvaluationCycleSwaggerDto;
}

export class UserEvaluationSwaggerDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  userId: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  cycleId?: string | null;

  @ApiProperty()
  completionPercent: number;

  @ApiProperty()
  selfScoreTotal: number;

  @ApiPropertyOptional({ nullable: true })
  principalScoreTotal?: number | null;

  @ApiProperty({ example: 'PENDING_EVALUATION' })
  status: string;

  @ApiProperty({
    type: 'array',
    items: { type: 'object', additionalProperties: true },
    description: 'Các mục A,B,C… đồng bộ từ OKR.',
  })
  evaluationData: unknown[];

  @ApiPropertyOptional({ nullable: true })
  selfComment?: string | null;

  @ApiPropertyOptional({ nullable: true })
  selfRating?: string | null;

  @ApiPropertyOptional({ nullable: true })
  managerComment?: string | null;

  @ApiPropertyOptional({ nullable: true })
  managerRating?: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;

  @ApiPropertyOptional({ type: OkrUserBriefDto })
  user?: OkrUserBriefDto;
}

export class MyEvaluationFormResponseDto extends UserEvaluationSwaggerDto {
  @ApiProperty({ description: 'Tên mục tiêu OKR / template hiển thị cho FE.' })
  okrObjectiveName: string;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Trạng thái `UserOkr` tương ứng (nếu có).',
  })
  okrStatus?: string | null;
}
