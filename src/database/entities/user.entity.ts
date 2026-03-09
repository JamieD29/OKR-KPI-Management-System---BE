// src/database/entities/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from './role.entity';
import { Department } from './department.entity';
import { ManagementPosition } from './management-position.entity';

// --- 🔥 1. ĐỊNH NGHĨA ENUM (Để đảm bảo dữ liệu nhất quán) ---
export enum AcademicRank {
  GS = 'Giáo sư',
  PGS = 'Phó giáo sư',
  NONE = 'Không',
}

export enum Degree {
  CN = 'Cử nhân',
  THS = 'Thạc sĩ',
  TS = 'Tiến sĩ',
  None = 'Không',
}

export enum JobTitle {
  DEAN = 'Trưởng khoa',
  VICE_DEAN = 'Phó khoa',
  HEAD_DEPT = 'Trưởng bộ môn',
  LECTURER = 'Giảng viên',
  SENIOR_LECTURER = 'Giảng viên chính',
  ASSISTANT = 'Trợ giảng',
  SPECIALIST = 'Chuyên viên',
  STAFF = 'Giáo vụ',
  RESEARCHER = 'Nghiên cứu viên',
  TECHNICIAN = 'Kỹ thuật viên',
  SUPPORT_STAFF = 'Nhân viên hỗ trợ',
}

export enum Gender {
  MALE = 'Nam',
  FEMALE = 'Nữ',
  OTHER = 'Khác',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  name: string;

  // @Column({ name: 'full_name', nullable: true })
  // fullName: string;

  @Column({ type: 'text', name: 'avatar_url', nullable: true })
  avatarUrl: string | null;

  @Column({ type: 'text', name: 'google_id', nullable: true })
  googleId: string | null;

  @Column({ type: 'text', name: 'microsoft_id', nullable: true })
  microsoftId: string | null;

  @Column({ default: false, name: 'is_active' })
  isActive: boolean;

  // --- 🔥 2. THÊM CÁC CỘT PROFILE MỚI (Bắt đầu từ đây) ---

  // Chức danh nghề nghiệp (Dùng để tính KPI/OKR)
  @Column({
    type: 'enum',
    enum: JobTitle,
    nullable: true,
    name: 'job_title',
  })
  jobTitle: JobTitle;

  // Học hàm (Giáo sư, Phó giáo sư...)
  @Column({
    type: 'enum',
    enum: AcademicRank,
    default: AcademicRank.NONE,
    name: 'academic_rank',
  })
  academicRank: AcademicRank;

  // Học vị (Tiến sĩ, Thạc sĩ...)
  @Column({
    type: 'enum',
    enum: Degree,
    default: Degree.CN,
    name: 'degree', // Tên cột trong DB sẽ là 'degree'
  })
  degree: Degree;

  @Column({
    type: 'enum',
    enum: Gender,
    default: Gender.MALE,
    name: 'gender',
  })
  gender: Gender;

  // Tổng giờ giảng (Số liệu quan trọng cho KPI)
  @Column({ type: 'float', default: 0, name: 'teaching_hours' })
  teachingHours: number;

  // Khen thưởng (Lưu dạng text dài hoặc JSON đều được, tạm để text)
  @Column({ type: 'text', nullable: true, name: 'awards' })
  awards: string;

  // Sở hữu trí tuệ
  @Column({ type: 'text', nullable: true, name: 'intellectual_property' })
  intellectualProperty: string;

  // Ngày gia nhập trường (Để tính thâm niên)
  @Column({ type: 'date', nullable: true, name: 'join_date' })
  joinDate: Date;

  @Column({
    name: 'staff_code',
    unique: true,
    nullable: true, // Để true vì lúc mới tạo bằng Google chưa có mã này
  })
  staffCode: string;

  // Đánh dấu user đã hoàn tất thiết lập hồ sơ lần đầu
  @Column({ default: false, name: 'profile_completed' })
  profileCompleted: boolean;

  // --- 👆 HẾT PHẦN THÊM MỚI ---

  // Chức vụ quản lý (Admin tự định nghĩa: Trưởng khoa, Phó khoa, ...)
  @ManyToOne(() => ManagementPosition, (pos) => pos.users, {
    nullable: true,
    eager: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'management_position_id' })
  managementPosition: ManagementPosition;

  @ManyToOne(() => Department, (dept) => dept.users, {
    nullable: true,
    onDelete: 'SET NULL',
    eager: true,
  })
  @JoinColumn({ name: 'department_id' })
  department: Department;

  // Giữ nguyên quan hệ Role này để phân quyền Admin/User
  @ManyToMany(() => Role)
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
