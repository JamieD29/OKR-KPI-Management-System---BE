import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @Column({ unique: true })
  name: string; // VD: Admin, Dean, Lecturer

  @Column({ unique: true })
  slug: string; // VD: ADMIN, DEAN, LECTURER (Dùng để check trong code)

  @Column({ type: 'text', nullable: true })
  description: string;
}
