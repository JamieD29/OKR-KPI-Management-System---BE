// key-result.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Objective } from './objective.entity';

@Entity('key_results')
export class KeyResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'float' })
  target: number; // Mục tiêu cần đạt (Ví dụ: 10 bài báo)

  @Column({ type: 'float', default: 0 })
  current: number; // Kết quả hiện tại (Ví dụ: Đã viết 2 bài)

  @Column({ type: 'varchar', length: 50 })
  unit: string; // Đơn vị: % , Bài, Môn học...

  @ManyToOne(() => Objective, (obj) => obj.keyResults, { onDelete: 'CASCADE' })
  objective: Objective;
}
