import { IsEnum, IsNumber, IsOptional, IsString, IsDateString, Min, IsUUID } from 'class-validator';
// 👇 SỬA LẠI ĐƯỜNG DẪN IMPORT NÀY CHO ĐÚNG CẤU TRÚC
import { AcademicRank, Degree, JobTitle, Gender } from '../../../database/entities/user.entity';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  avatar?: string; // Bên Entity mày đặt là avatar_url (DB) nhưng DTO nên dùng camelCase

  @IsOptional()
  @IsEnum(JobTitle, { message: 'Chức vụ không hợp lệ' })
  jobTitle?: JobTitle;

  @IsOptional()
  @IsEnum(AcademicRank, { message: 'Học hàm không hợp lệ' })
  academicRank?: AcademicRank;

  @IsOptional()
  @IsEnum(Degree, { message: 'Học vị không hợp lệ' })
  degree?: Degree;

  @IsOptional()
  @IsNumber({}, { message: 'Giờ giảng phải là số' })
  @Min(0, { message: 'Giờ giảng không được âm' })
  teachingHours?: number;

  @IsOptional()
  @IsString()
  awards?: string;

  @IsOptional()
  @IsString()
  intellectualProperty?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày gia nhập sai định dạng (YYYY-MM-DD)' })
  joinDate?: string;

  @IsOptional()
  @IsEnum(Gender, { message: 'Giới tính không hợp lệ' })
  gender?: Gender;

  @IsOptional()
  @IsUUID('4', { message: 'ID Bộ môn phải là UUID chuẩn' })
  departmentId?: string; // 👈 Frontend sẽ gửi ID của bộ môn vào đây

  @IsOptional()
  @IsString()
  // @Matches(/^[A-Z0-9]+$/, { message: 'Mã cán bộ chỉ chứa chữ hoa và số' }) // Bật nếu muốn validate cứng
  staffCode?: string;
}
