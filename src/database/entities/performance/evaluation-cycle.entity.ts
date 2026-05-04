import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum EvaluationStatus {
  OPEN = 'OPEN', // Đang mở cho nhập liệu
  CLOSED = 'CLOSED', // Đã đóng, không cho nhập liệu
  //LOCKED = 'LOCKED', // Khóa nhập, đang chấm điểm
  ARCHIVED = 'ARCHIVED', // Lưu trữ
}

export enum CycleType {
  SEMESTER = 'SEMESTER',
  QUARTER = 'QUARTER',
  OTHER = 'OTHER',
}

@Entity('evaluation_cycles')
export class EvaluationCycle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // VD: "Học kỳ 1 - 2025-2026"

  @Column({ type: 'enum', enum: EvaluationStatus, default: EvaluationStatus.CLOSED })
  status: EvaluationStatus;

  @Column({ type: 'enum', enum: CycleType, default: CycleType.OTHER })
  type: CycleType;

  @Column({ type: 'date', nullable: true })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
