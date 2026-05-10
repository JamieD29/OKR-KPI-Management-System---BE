import { ApiPropertyOptional } from '@nestjs/swagger';
import { ValidateIf, IsUUID } from 'class-validator';

export class AssignManagementPositionDto {
  @ApiPropertyOptional({
    nullable: true,
    format: 'uuid',
    description:
      'UUID chức vụ quản lý (`management_positions`). Gửi `null` để gỡ chức vụ.',
  })
  @ValidateIf((_, v) => v != null)
  @IsUUID('4')
  positionId?: string | null;
}
