import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AcademicRank,
  Degree,
  Gender,
  JobTitle,
} from '../../../database/entities/user.entity';
import { PermissionLevel } from '../../../database/entities/management-position.entity';

/** Một lựa chọn enum cho FE (profile-options). */
export class ProfileEnumOptionDto {
  @ApiProperty({ description: 'Giá trị lưu DB / gửi API (tiếng Việt từ enum entity).' })
  value: string;

  @ApiProperty({ description: 'Nhãn hiển thị (thường trùng **value**, trừ học hàm NONE).' })
  label: string;

  @ApiProperty({ description: 'Tên khóa enum TypeScript (ví dụ *LECTURER*).' })
  key: string;
}

export class ProfileOptionsResponseDto {
  @ApiProperty({ type: [ProfileEnumOptionDto] })
  jobTitles: ProfileEnumOptionDto[];

  @ApiProperty({ type: [ProfileEnumOptionDto] })
  academicRanks: ProfileEnumOptionDto[];

  @ApiProperty({ type: [ProfileEnumOptionDto] })
  degrees: ProfileEnumOptionDto[];

  @ApiProperty({ type: [ProfileEnumOptionDto] })
  genders: ProfileEnumOptionDto[];
}

export class UserRoleSwaggerDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Admin' })
  name: string;

  @ApiProperty({ example: 'ADMIN' })
  slug: string;

  @ApiPropertyOptional({ nullable: true })
  description?: string | null;
}

export class DepartmentSwaggerDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  code: string;

  @ApiPropertyOptional({ nullable: true })
  description?: string | null;
}

export class ManagementPositionSwaggerDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Trưởng khoa' })
  name: string;

  @ApiProperty({ example: 'TRUONG_KHOA' })
  slug: string;

  @ApiPropertyOptional({ nullable: true })
  description?: string | null;

  @ApiProperty({ enum: PermissionLevel })
  permissionLevel: PermissionLevel;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

/**
 * User đầy đủ như các thao tác findOne / findAll / findByRole (kèm roles, department,
 * managementPosition).
 */
export class UserDetailSwaggerDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional({ nullable: true })
  name?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'URL ảnh đại diện (cột **avatar_url**).',
  })
  avatarUrl?: string | null;

  @ApiPropertyOptional({ nullable: true })
  googleId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  microsoftId?: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional({ enum: JobTitle, nullable: true })
  jobTitle?: JobTitle | null;

  @ApiProperty({ enum: AcademicRank })
  academicRank: AcademicRank;

  @ApiProperty({ enum: Degree })
  degree: Degree;

  @ApiProperty({ enum: Gender })
  gender: Gender;

  @ApiProperty()
  teachingHours: number;

  @ApiPropertyOptional({ nullable: true })
  awards?: string | null;

  @ApiPropertyOptional({ nullable: true })
  intellectualProperty?: string | null;

  @ApiPropertyOptional({ type: String, format: 'date', nullable: true })
  joinDate?: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date', nullable: true })
  dateOfBirth?: Date | null;

  @ApiPropertyOptional({ nullable: true })
  staffCode?: string | null;

  @ApiProperty()
  profileCompleted: boolean;

  @ApiPropertyOptional({ type: ManagementPositionSwaggerDto, nullable: true })
  managementPosition?: ManagementPositionSwaggerDto | null;

  @ApiPropertyOptional({ type: DepartmentSwaggerDto, nullable: true })
  department?: DepartmentSwaggerDto | null;

  @ApiProperty({ type: [UserRoleSwaggerDto] })
  roles: UserRoleSwaggerDto[];

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
