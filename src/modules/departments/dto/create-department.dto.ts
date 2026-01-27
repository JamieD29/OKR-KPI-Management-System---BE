import { IsNotEmpty, IsOptional, IsString, Matches, Length } from 'class-validator';

export class CreateDepartmentDto {
  @IsNotEmpty({ message: 'Tên bộ môn không được để trống' })
  @Matches(/^[a-zA-Z0-9\sÀ-ỹ-]+$/, {
    message: 'Tên bộ môn không được chứa ký tự đặc biệt (@, #, $...)',
  })
  // Giải thích regex: Cho phép chữ cái (cả tiếng Việt À-ỹ), số, khoảng trắng và dấu gạch ngang
  name: string;

  @IsNotEmpty({ message: 'Mã bộ môn không được để trống' })
  @Matches(/^[A-Z0-9_]+$/, {
    message: 'Mã bộ môn chỉ được chứa chữ HOA, số và dấu gạch dưới (_)',
  })
  @Length(2, 10, { message: 'Mã bộ môn phải từ 2 đến 10 ký tự' })
  code: string;

  @IsOptional()
  @IsString()
  description?: string;
}
