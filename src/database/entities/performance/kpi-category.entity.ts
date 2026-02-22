import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { KpiTemplate } from './kpi-template.entity';

@Entity('kpi_categories')
export class KpiCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // VD: "Nhiệm vụ giảng dạy"

  @Column({ unique: true })
  code: string; // VD: "GROUP_A"

  // 👇 Cấu hình điểm trần (Max point) cho từng Role
  // VD: { "DEAN": 10, "LECTURER": 60 }
  @Column({ type: 'jsonb', default: {} })
  maxPointsByRole: Record<string, number>;

  @OneToMany(() => KpiTemplate, (template) => template.category)
  templates: KpiTemplate[];
}
