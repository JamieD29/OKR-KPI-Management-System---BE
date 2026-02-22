import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../user.entity';
import { EvaluationCycle } from './evaluation-cycle.entity';
import { KpiCategory } from './kpi-category.entity';
import { KpiTemplate } from './kpi-template.entity'; // 👈 Đảm bảo import dòng này

export enum KpiStatus {
  DRAFT = 'DRAFT', // Nháp (chưa gửi)
  PENDING = 'PENDING', // Đã gửi, chờ duyệt
  APPROVED = 'APPROVED', // Đã duyệt
  REJECTED = 'REJECTED', // Từ chối
}

@Entity('user_kpis')
export class UserKpi {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ==========================================
  // 1. LIÊN KẾT USER (Code: userId <-> DB: user_id)
  // ==========================================
  @Column({ name: 'user_id' }) // 👈 QUAN TRỌNG: Ánh xạ vào cột user_id
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // ==========================================
  // 2. LIÊN KẾT CYCLE (Code: cycleId <-> DB: cycle_id)
  // ==========================================
  @Column({ name: 'cycle_id' }) // 👈 QUAN TRỌNG
  cycleId: string;

  @ManyToOne(() => EvaluationCycle, (cycle) => cycle.userKpis, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cycle_id' })
  cycle: EvaluationCycle;

  // ==========================================
  // 3. LIÊN KẾT CATEGORY (Code: categoryId <-> DB: category_id)
  // ==========================================
  @Column({ name: 'category_id' }) // 👈 QUAN TRỌNG
  categoryId: string;

  @ManyToOne(() => KpiCategory)
  @JoinColumn({ name: 'category_id' })
  category: KpiCategory;

  // ==========================================
  // 4. LIÊN KẾT TEMPLATE (Cái này mày đang THIẾU -> Gây lỗi 500 khi view)
  // ==========================================
  @Column({ type: 'uuid', nullable: true, name: 'template_id' }) // 👈 Thêm name vào đây
  templateId: string | null;

  @ManyToOne(() => KpiTemplate) // 👈 Bổ sung Relation này
  @JoinColumn({ name: 'template_id' })
  template: KpiTemplate;

  // ==========================================
  // DỮ LIỆU KHÁC
  // ==========================================
  @Column()
  content: string;

  @Column({ type: 'float', default: 0 })
  quantity: number;

  @Column({ type: 'float', default: 0, name: 'self_score' }) // Nên map sang self_score cho chuẩn DB
  selfScore: number;

  @Column({ type: 'float', default: 0, name: 'manager_score' })
  managerScore: number;

  @Column({ nullable: true, name: 'evidence_url' }) // Map sang evidence_url
  evidenceUrl: string;

  @Column({ nullable: true, name: 'manager_comment' })
  managerComment: string;

  @Column({
    type: 'enum',
    enum: KpiStatus,
    default: KpiStatus.PENDING,
  })
  status: KpiStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
