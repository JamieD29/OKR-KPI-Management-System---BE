import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { KpiCategory } from './kpi-category.entity';

@Entity('kpi_templates')
export class KpiTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  content: string;

  @Column({ nullable: true })
  unit: string;

  @Column({ type: 'float', default: 0 })
  basePoint: number;

  // 👇 SỬA LẠI DÒNG NÀY: name phải trùng với tên biến ở dưới (categoryId)
  @ManyToOne(() => KpiCategory, (category) => category.templates)
  @JoinColumn({ name: 'categoryId' })
  category: KpiCategory;

  @Column()
  categoryId: string;
}
