import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserKpi } from './user-kpi.entity';

export enum EvaluationStatus {
  OPEN = 'OPEN', // Đang mở cho nhập liệu
  CLOSED = 'CLOSED', // Đã đóng, không cho nhập liệu
  //LOCKED = 'LOCKED', // Khóa nhập, đang chấm điểm
  ARCHIVED = 'ARCHIVED', // Lưu trữ
}

@Entity('evaluation_cycles')
export class EvaluationCycle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // VD: "Học kỳ 1 - 2025-2026"

  @Column({ type: 'enum', enum: EvaluationStatus, default: EvaluationStatus.OPEN })
  status: EvaluationStatus;

  @Column({ type: 'date', nullable: true })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 👇 THÊM ĐOẠN NÀY VÀO:
  @OneToMany(() => UserKpi, (userKpi) => userKpi.cycle)
  userKpis: UserKpi[];
}
