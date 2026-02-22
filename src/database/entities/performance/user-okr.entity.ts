import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
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
  @Column()
  userId: string;

  @ManyToOne(() => EvaluationCycle)
  @JoinColumn({ name: 'cycle_id' })
  cycle: EvaluationCycle;
  @Column()
  cycleId: string;

  @Column()
  objective: string; // VD: "Học chứng chỉ IELTS"

  // Lưu danh sách Key Results dạng JSON cho gọn nhẹ
  // Format: [{ content: "...", target: 10, actual: 5, score: 50 }]
  @Column({ type: 'jsonb', default: [] })
  keyResults: any;

  @Column({ type: 'float', default: 0 })
  totalScore: number; // Điểm tổng kết mục này (đã nhân trọng số nếu có)

  @CreateDateColumn()
  createdAt: Date;
}
