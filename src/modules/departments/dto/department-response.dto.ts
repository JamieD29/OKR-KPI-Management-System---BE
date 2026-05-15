import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Bản ghi department sau create/update/save/delete (không kèm danh sách users). */
export class DepartmentEntityResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Công nghệ phần mềm' })
  name: string;

  @ApiProperty({ example: 'CNPM' })
  code: string;

  @ApiPropertyOptional({ nullable: true })
  description?: string | null;
}

/** Một phần tử trong GET /departments: thêm memberCount, không trả users trong JSON. */
export class DepartmentListItemDto extends DepartmentEntityResponseDto {
  @ApiProperty({
    example: 12,
    description: 'Số user thuộc bộ môn (trước khi ẩn danh sách user khỏi JSON).',
  })
  memberCount: number;
}
