// objective.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { KeyResult } from './key-result.entity';

@Entity('objectives')
export class Objective {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  // Phân loại: DEPARTMENT (Bộ môn) hoặc PERSONAL (Cá nhân)
  @Column({ type: 'varchar', length: 50 })
  type: string;

  // ID của Học kỳ (Liên kết với bảng EvaluationCycle)
  @Column()
  cycleId: string;

  // ID của Bộ môn (Nếu là OKR Bộ môn)
  @Column({ nullable: true })
  departmentId: string;

  // ID của User (Nếu là OKR Cá nhân)
  @Column({ nullable: true })
  userId: string;

  @Column({ type: 'float', default: 0 })
  progress: number;

  @Column({ type: 'varchar', default: 'ON_TRACK' })
  status: string; // ON_TRACK | AT_RISK | BEHIND

  @CreateDateColumn()
  createdAt: Date;

  // Quan hệ 1 Objective có NHIỀU KeyResult. Bật cascade để tự động lưu mảng KR.
  @OneToMany(() => KeyResult, (kr) => kr.objective, { cascade: true })
  keyResults: KeyResult[];
}
