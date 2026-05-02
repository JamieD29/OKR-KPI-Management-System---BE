import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { AllowedDomain } from './entities/allowed-domain.entity';
import { Role } from './entities/role.entity';
import { Department } from './entities/department.entity';
import {
  AcademicRank,
  Degree,
  JobTitle,
  Gender,
} from './entities/user.entity';

@Injectable()
export class DatabaseSeederService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseSeederService.name);

  constructor(
    @InjectRepository(AllowedDomain)
    private domainRepository: Repository<AllowedDomain>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Department)
    private departmentRepository: Repository<Department>,
    private dataSource: DataSource,
  ) {}

  async onModuleInit() {
    await this.runMigrations();
    await this.seedRoles();
    await this.seedDomains();
    await this.seedDepartments();
  }

  private async runMigrations() {
    try {
      await this.dataSource.query(`
                DO $$ 
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'permission_level_enum') THEN
                        CREATE TYPE permission_level_enum AS ENUM ('SYSTEM', 'KHOA', 'DON_VI', 'NONE');
                    END IF;
                END $$;
            `);

      await this.dataSource.query(`
                ALTER TABLE "management_positions" 
                ADD COLUMN IF NOT EXISTS "permission_level" permission_level_enum DEFAULT 'NONE';
            `);

      await this.dataSource.query(`
                UPDATE "management_positions" SET "permission_level" = 'KHOA' WHERE "slug" IN ('TRUONG_KHOA', 'PHO_TRUONG_KHOA');
                UPDATE "management_positions" SET "permission_level" = 'DON_VI' WHERE "slug" IN ('TRUONG_PHONG', 'PHO_TRUONG_PHONG', 'TRUONG_BO_MON', 'PHO_TRUONG_BO_MON');
                UPDATE "management_positions" SET "permission_level" = 'SYSTEM' WHERE "slug" IN ('HIEU_TRUONG', 'HIEU_PHO');
            `);
      this.logger.log('✅ Manual migrations ran successfully.');
    } catch (error) {
      this.logger.error('❌ Failed to run manual migrations:', error.message);
    }
  }

  // ============================================================
  // SEED PATTERN: "Ensure Defaults Exist"
  // → Luôn kiểm tra từng record mặc định, tạo mới nếu thiếu.
  // → Không skip toàn bộ khi bảng đã có dữ liệu.
  // ============================================================

  public async seedRoles() {
    const defaultRoles = [
      { name: 'Admin', slug: 'ADMIN', description: 'Quản trị viên hệ thống' },
      { name: 'User', slug: 'USER', description: 'Người dùng hệ thống' },
    ];

    let created = 0;
    for (const role of defaultRoles) {
      const exists = await this.roleRepository.findOne({ where: { slug: role.slug } });
      if (!exists) {
        await this.roleRepository.save(this.roleRepository.create(role));
        this.logger.log(`  ✅ Created role: ${role.name} (${role.slug})`);
        created++;
      }
    }
    if (created > 0) {
      this.logger.log(`🌱 Seeded ${created} missing role(s).`);
    }
  }

  public async seedDomains() {
    const defaultDomains = ['gmail.com', 'itec.hcmus.edu.vn', 'student.hcmus.edu.vn'];

    let created = 0;
    for (const domain of defaultDomains) {
      const exists = await this.domainRepository.findOne({ where: { domain } });
      if (!exists) {
        await this.domainRepository.save(this.domainRepository.create({ domain }));
        this.logger.log(`  ✅ Added domain: ${domain}`);
        created++;
      }
    }
    if (created > 0) {
      this.logger.log(`🌱 Seeded ${created} missing domain(s).`);
    }
  }

  public async seedDepartments() {
    const defaultDepts = [
      { name: 'Công nghệ phần mềm', code: 'CNPM', description: 'Khoa CNTT' },
      { name: 'Công nghệ tri thức', code: 'CNTT', description: 'Khoa CNTT' },
      { name: 'Hệ thống thông tin', code: 'HTTT', description: 'Khoa CNTT' },
      { name: 'Khoa học máy tính', code: 'KHMT', description: 'Khoa CNTT' },
      { name: 'Mạng máy tính và Viễn thông', code: 'MMT', description: 'Khoa CNTT' },
      { name: 'Thị giác máy tính và điều khiển học thông minh', code: 'TGMT', description: 'Khoa CNTT' },
    ];

    let created = 0;
    for (const dept of defaultDepts) {
      const exists = await this.departmentRepository.findOne({ where: { code: dept.code } });
      if (!exists) {
        await this.departmentRepository.save(this.departmentRepository.create(dept));
        this.logger.log(`  ✅ Added department: ${dept.name}`);
        created++;
      }
    }
    if (created > 0) {
      this.logger.log(`🌱 Seeded ${created} missing department(s).`);
    }
  }

  // ============================================================
  // SINGLE SOURCE OF TRUTH: Profile Enum Options
  // → FE gọi API này thay vì hardcode danh sách.
  // → Khi cần thêm/sửa giá trị, chỉ cần sửa enum ở user.entity.ts
  // ============================================================

  public getProfileOptions() {
    return {
      jobTitles: Object.entries(JobTitle).map(([key, value]) => ({
        value,
        label: value,
        key,
      })),
      academicRanks: Object.entries(AcademicRank).map(([key, value]) => ({
        value,
        label: key === 'NONE' ? 'Không có học hàm' : value,
        key,
      })),
      degrees: Object.entries(Degree).map(([key, value]) => ({
        value,
        label: value,
        key,
      })),
      genders: Object.entries(Gender).map(([key, value]) => ({
        value,
        label: value,
        key,
      })),
    };
  }

  // ============================================================
  // FACTORY RESET: Khôi phục cài đặt gốc toàn hệ thống
  // ============================================================
  public async factoryReset() {
    this.logger.warn('⚠️ KÍCH HOẠT FACTORY RESET: Hệ thống đang xóa dữ liệu...');
    
    // Xóa sạch mọi bảng trừ migration (nếu có)
    await this.dataSource.query(`
      TRUNCATE TABLE 
        key_results, 
        objectives, 
        user_okrs, 
        okr_templates, 
        evaluation_cycles, 
        system_logs, 
        notifications, 
        user_roles, 
        users, 
        roles, 
        departments, 
        management_positions,
        allowed_domains 
      CASCADE;
    `);

    this.logger.log('✅ Xóa sạch dữ liệu thành công. Đang tiến hành nạp lại dữ liệu mặc định...');
    
    // Nạp lại cấu hình nền
    await this.seedRoles();
    await this.seedDomains();
    await this.seedDepartments();
    
    this.logger.log('🚀 HOÀN TẤT FACTORY RESET!');
  }
}
