import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string; // VD: Admin, User

  @Column({ unique: true })
  slug: string; // VD: ADMIN, USER (Dùng để check trong code)

  @Column({ type: 'text', nullable: true })
  description: string;
}
