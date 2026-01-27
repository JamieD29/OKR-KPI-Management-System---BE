import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('allowed_domains')
export class AllowedDomain {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  domain: string;

  @CreateDateColumn({ name: 'added_at' })
  addedAt: Date;
}
