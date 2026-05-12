import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Bản ghi department như sau create/update/save/delete (không kèm `users`). */
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

/** Một phần tử trong `GET /departments`: thêm `memberCount`, không trả `users`. */
export class DepartmentListItemDto extends DepartmentEntityResponseDto {
  @ApiProperty({
    example: 12,
    description: 'Số user thuộc bộ môn (`users.length` trước khi strip khỏi JSON).',
  })
  memberCount: number;
}
