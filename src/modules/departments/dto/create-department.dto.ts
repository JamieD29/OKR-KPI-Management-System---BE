import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches, Length } from 'class-validator';

export class CreateDepartmentDto {
  @ApiProperty({
    example: 'Công nghệ phần mềm',
    description: 'Tên bộ môn (duy nhất theo logic service — không trùng **name**).',
  })
  @IsNotEmpty({ message: 'Tên bộ môn không được để trống' })
  @Matches(/^[a-zA-Z0-9\sÀ-ỹ-]+$/, {
    message: 'Tên bộ môn không được chứa ký tự đặc biệt (@, #, $...)',
  })
  name: string;

  @ApiProperty({
    example: 'CNPM',
    description: 'Mã bộ môn unique, 2–10 ký tự, chữ HOA/số/_',
  })
  @IsNotEmpty({ message: 'Mã bộ môn không được để trống' })
  @Matches(/^[A-Z0-9_]+$/, {
    message: 'Mã bộ môn chỉ được chứa chữ HOA, số và dấu gạch dưới (_)',
  })
  @Length(2, 10, { message: 'Mã bộ môn phải từ 2 đến 10 ký tự' })
  code: string;

  @ApiPropertyOptional({ description: 'Mô tả (optional).' })
  @IsOptional()
  @IsString()
  description?: string;
}
