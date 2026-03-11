import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum PermissionLevel {
    SYSTEM = 'SYSTEM',
    KHOA = 'KHOA',
    DON_VI = 'DON_VI',
    NONE = 'NONE'
}

@Entity('management_positions')
export class ManagementPosition {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string; // VD: "Trưởng khoa", "Phó khoa", "Trưởng bộ môn"

    @Column({ unique: true })
    slug: string; // VD: "TRUONG_KHOA", "PHO_KHOA" — Dùng để check trong code

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({
        type: 'enum',
        enum: PermissionLevel,
        default: PermissionLevel.NONE,
        name: 'permission_level'
    })
    permissionLevel: PermissionLevel;

    @OneToMany(() => User, (user) => user.managementPosition)
    users: User[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
