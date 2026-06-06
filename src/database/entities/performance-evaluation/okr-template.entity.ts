import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('okr_templates')
export class OkrTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ nullable: true })
  departmentId: string; // Trưởng khoa tạo template cho khoa của mình

  @Column({ nullable: true })
  positionId: string; // Chức vụ (ManagementPosition) - VD: Phó khoa

  @Column({ nullable: true })
  jobTitle: string; // Chức danh nghề nghiệp - VD: Giảng viên, Chuyên viên, Nghiên cứu viên

  @Column({ nullable: true })
  positionName: string; // Tên chức vụ hiển thị (VD: Phó khoa)

  @Column({ nullable: true })
  createdByUserId: string; // ID người tạo template

  @Column({ nullable: true })
  createdByName: string; // Tên người tạo template

  // JSONB lưu trữ toàn bộ cấu trúc phân cấp (A -> 1 -> 1.1) và các mức điểm
  // Mỗi item có: id, type, title, maxScore, unitScore, unit, items[]
  @Column({ type: 'jsonb', default: [] })
  structure: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
