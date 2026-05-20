import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LogStatus } from '../../../database/entities/system-log.entity';

/** User tối thiểu trong log; response thực tế có thể có thêm field (eager). */
export class SystemLogUserBriefDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'admin@example.com' })
  email: string;

  @ApiPropertyOptional({ nullable: true })
  name?: string | null;
}

export class SystemLogItemDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiPropertyOptional({
    nullable: true,
    type: SystemLogUserBriefDto,
    description:
      'Người thực hiện. **null** nếu không gán hoặc user đã xóa (DB set null). Có thể kèm quan hệ **User** tải sẵn.',
  })
  user?: SystemLogUserBriefDto | null;

  @ApiProperty({ example: 'CREATE', maxLength: 50 })
  action: string;

  @ApiProperty({ example: 'DEPARTMENT', maxLength: 50 })
  resource: string;

  @ApiPropertyOptional({ nullable: true })
  message?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    type: 'object',
    additionalProperties: true,
    description: 'JSON chi tiết (vd. cặp *old* / *new*) từ cột **jsonb**.',
  })
  details?: Record<string, unknown> | null;

  @ApiProperty({ enum: LogStatus })
  status: LogStatus;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}

export class ClearSystemLogsResponseDto {
  @ApiProperty({ example: 'Đã xóa toàn bộ nhật ký hệ thống.' })
  message: string;
}
