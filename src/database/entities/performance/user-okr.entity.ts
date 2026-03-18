import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
// 👇 Import User đi ngược ra 1 cấp folder
import { User } from '../user.entity';
import { EvaluationCycle } from './evaluation-cycle.entity';

@Entity('user_okrs')
export class UserOkr {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @ManyToOne(() => EvaluationCycle)
  @JoinColumn({ name: 'cycle_id' })
  cycle: EvaluationCycle;
  @Column({ name: 'cycle_id', nullable: true })
  cycleId: string;

  @Column()
  objective: string; // VD: "Học chứng chỉ IELTS"

  // Lưu danh sách Key Results dạng JSON cho gọn nhẹ
  // Format: [{ content: "...", target: 10, actual: 5, score: 50 }]
  @Column({ type: 'jsonb', default: [] })
  keyResults: any;

  @Column({ type: 'float', default: 0 })
  totalScore: number; // Điểm tổng kết mục này (đã nhân trọng số nếu có)

  @Column({ nullable: true })
  templateId: string;

  @Column({ default: 'PENDING' })
  status: string; // PENDING, NEGOTIATING, ACCEPTED, REJECTED

  @Column({ type: 'jsonb', nullable: true })
  proposedChanges: any;

  @Column({ type: 'timestamp', nullable: true })
  deadline: Date;

  // Dữ liệu tự khai từ user: { [krId]: { quantity: number, evidence: string } }
  @Column({ type: 'jsonb', nullable: true })
  selfReportData: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
