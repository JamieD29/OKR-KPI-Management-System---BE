import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { AllowedDomain } from './entities/allowed-domain.entity';
import { Role } from './entities/role.entity';

@Injectable()
export class DatabaseSeederService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseSeederService.name);

  constructor(
    @InjectRepository(AllowedDomain)
    private domainRepository: Repository<AllowedDomain>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private dataSource: DataSource,
  ) {}

  async onModuleInit() {
    await this.runMigrations();
    await this.seedRoles();
    await this.seedDomains();
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

  private async seedRoles() {
    const count = await this.roleRepository.count();
    if (count > 0) return;

    this.logger.log('🌱 Seeding default roles...');
    const defaultRoles = [
      { name: 'Admin', slug: 'ADMIN', description: 'Quản trị viên hệ thống' },
      { name: 'User', slug: 'USER', description: 'Người dùng hệ thống' },
    ];

    for (const role of defaultRoles) {
      const exists = await this.roleRepository.findOne({ where: { slug: role.slug } });
      if (!exists) {
        await this.roleRepository.save(this.roleRepository.create(role));
        this.logger.log(`  ✅ Created role: ${role.name} (${role.slug})`);
      }
    }
  }

  private async seedDomains() {
    const count = await this.domainRepository.count();
    if (count > 0) return;

    this.logger.log('🌱 Seeding default allowed domains...');
    const defaultDomains = ['gmail.com', 'itec.hcmus.edu.vn'];

    for (const domain of defaultDomains) {
      const exists = await this.domainRepository.findOne({ where: { domain } });
      if (!exists) {
        await this.domainRepository.save(this.domainRepository.create({ domain }));
        this.logger.log(`  ✅ Added domain: ${domain}`);
      }
    }
  }
}
