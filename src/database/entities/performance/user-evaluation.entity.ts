import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../user.entity';
import { EvaluationCycle } from './evaluation-cycle.entity';

@Entity('user_evaluations')
export class UserEvaluation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => EvaluationCycle)
  @JoinColumn({ name: 'cycle_id' })
  cycle: EvaluationCycle;

  @Column({ name: 'cycle_id', nullable: true })
  cycleId: string;

  @Column({ type: 'float', default: 0 })
  completionPercent: number; // Tổng % hoàn thành OKR

  @Column({ type: 'float', default: 0 })
  selfScoreTotal: number; // Tổng điểm Tự Đánh Giá

  @Column({ type: 'float', default: 0, nullable: true })
  principalScoreTotal: number; // Tổng điểm Hiệu trưởng Đánh Giá

  @Column({ default: 'PENDING_EVALUATION' })
  status: string; // PENDING_EVALUATION, EVALUATED

  // Lưu chi tiết các Nhiệm vụ (A, B, C, D, E) dưới dạng mảng kết quả
  // [{ id: "A", name: "Nhiệm vụ Giảng dạy", score: 35 }]
  @Column({ type: 'jsonb', default: [] })
  evaluationData: any;

  // PHẦN III: TỰ NHẬN XÉT, XẾP LOẠI
  @Column({ type: 'text', nullable: true })
  selfComment: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  selfRating: string; // EXCELLENT, GOOD, POOR

  // PHẦN IV: ĐÁNH GIÁ CỦA CẤP QUẢN LÝ
  @Column({ type: 'text', nullable: true })
  managerComment: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  managerRating: string; // EXCELLENT, GOOD, POOR

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
