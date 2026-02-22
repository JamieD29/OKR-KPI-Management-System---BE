import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum LogStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

@Entity('system_logs')
export class SystemLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Link tới người thực hiện (nếu user bị xóa thì set null để giữ lại log)
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 50 })
  action: string; // VD: CREATE, UPDATE, DELETE, LOGIN

  @Column({ type: 'varchar', length: 50 })
  resource: string; // VD: DEPARTMENT, USER, ROLE

  @Column({ type: 'text', nullable: true })
  message: string; // VD: "Minh Ha đã tạo bộ môn Khoa học máy tính"

  @Column({ type: 'jsonb', nullable: true })
  details: any; // JSON lưu dữ liệu cũ/mới để đối chiếu

  @Column({ type: 'enum', enum: LogStatus, default: LogStatus.SUCCESS })
  status: LogStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
