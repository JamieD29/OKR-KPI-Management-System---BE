import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  Min,
  IsUUID,
} from 'class-validator';
import {
  AcademicRank,
  Degree,
  JobTitle,
  Gender,
} from '../../../database/entities/user.entity';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Nguyễn Văn A' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'URL ảnh đại diện (map tới cột `avatar_url`).' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ enum: JobTitle })
  @IsOptional()
  @IsEnum(JobTitle, { message: 'Chức vụ không hợp lệ' })
  jobTitle?: JobTitle;

  @ApiPropertyOptional({ enum: AcademicRank })
  @IsOptional()
  @IsEnum(AcademicRank, { message: 'Học hàm không hợp lệ' })
  academicRank?: AcademicRank;

  @ApiPropertyOptional({ enum: Degree })
  @IsOptional()
  @IsEnum(Degree, { message: 'Học vị không hợp lệ' })
  degree?: Degree;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber({}, { message: 'Giờ giảng phải là số' })
  @Min(0, { message: 'Giờ giảng không được âm' })
  teachingHours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  awards?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  intellectualProperty?: string;

  @ApiPropertyOptional({ format: 'date', example: '2020-09-01' })
  @IsOptional()
  @IsDateString({}, { message: 'Ngày gia nhập sai định dạng (YYYY-MM-DD)' })
  joinDate?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender, { message: 'Giới tính không hợp lệ' })
  gender?: Gender;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4', { message: 'ID Bộ môn phải là UUID chuẩn' })
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  staffCode?: string;

  @ApiPropertyOptional({ format: 'date', example: '1990-01-15' })
  @IsOptional()
  @IsDateString({}, { message: 'Ngày sinh sai định dạng (YYYY-MM-DD)' })
  dateOfBirth?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean({ message: 'profileCompleted phải là boolean' })
  profileCompleted?: boolean;
}
