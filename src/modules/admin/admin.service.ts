import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
// 👇 Import từ thư mục database chung của mày
import { AllowedDomain } from '../../database/entities/allowed-domain.entity';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(AllowedDomain)
    private domainRepository: Repository<AllowedDomain>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll() {
    const domains = await this.domainRepository.find({ order: { addedAt: 'DESC' } });
    
    const domainsWithCount = await Promise.all(
      domains.map(async (domainEntity) => {
        const userCount = await this.userRepository.count({
          where: { email: Like(`%@${domainEntity.domain}`) },
        });
        return {
          ...domainEntity,
          userCount,
        };
      })
    );

    return { domains: domainsWithCount };
  }

  async create(domainName: string) {
    const exists = await this.domainRepository.findOne({ where: { domain: domainName } });
    if (exists) throw new ConflictException('Domain already exists');

    const newDomain = this.domainRepository.create({
      domain: domainName,
      addedAt: new Date(),
    });
    return { domain: await this.domainRepository.save(newDomain) };
  }

  async remove(id: string) {
    const domain = await this.domainRepository.findOne({ where: { id } });
    if (!domain) throw new NotFoundException('Domain not found');

    const totalDomains = await this.domainRepository.count();
    if (totalDomains <= 1) {
      throw new ConflictException('Hệ thống phải có ít nhất 1 tên miền hoạt động. Không thể xóa.');
    }

    const usersUsingDomain = await this.userRepository.count({
      where: { email: Like(`%@${domain.domain}`) }
    });

    if (usersUsingDomain > 0) {
      throw new ConflictException(`Không thể xóa! Có ${usersUsingDomain} nhân viên đang sử dụng tên miền này.`);
    }

    await this.domainRepository.remove(domain);
    return { message: 'Domain removed successfully' };
  }
}
