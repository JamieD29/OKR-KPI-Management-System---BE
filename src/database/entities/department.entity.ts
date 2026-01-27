import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { User } from './user.entity';

@Entity('departments')
export class Department {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column() // Tên có thể trùng (ví dụ Khoa A có bộ môn X, Khoa B cũng có bộ môn X) - Tùy logic
  name: string;

  @Column({ unique: true }) // 👈 THÊM DÒNG NÀY: Mã bộ môn phải duy nhất
  code: string;

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => User, (user) => user.department)
  users: User[];
}
