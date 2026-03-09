import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    ) { }

    async onModuleInit() {
        await this.seedRoles();
        await this.seedDomains();
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
