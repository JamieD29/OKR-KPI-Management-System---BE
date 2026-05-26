import { ApiPropertyOptional } from '@nestjs/swagger';
import { ValidateIf, IsUUID } from 'class-validator';

export class AssignDepartmentDto {
  @ApiPropertyOptional({
    nullable: true,
    format: 'uuid',
    description:
      'UUID bộ môn trong bảng **departments**. Gửi *null* để gỡ khỏi bộ môn.',
  })
  @ValidateIf((_, v) => v != null)
  @IsUUID('4')
  departmentId?: string | null;
}
