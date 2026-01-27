import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// 👇 Import từ thư mục database chung của mày
import { AllowedDomain } from '../../database/entities/allowed-domain.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(AllowedDomain)
    private domainRepository: Repository<AllowedDomain>,
  ) {}

  async findAll() {
    return { 
        domains: await this.domainRepository.find({ order: { addedAt: 'DESC' } }) 
    };
  }

  async create(domainName: string) {
    const exists = await this.domainRepository.findOne({ where: { domain: domainName } });
    if (exists) throw new ConflictException('Domain already exists');

    const newDomain = this.domainRepository.create({
      domain: domainName,
      addedAt: new Date()
    });
    return { domain: await this.domainRepository.save(newDomain) };
  }

  async remove(id: string) {
    const domain = await this.domainRepository.findOne({ where: { id } });
    if (!domain) throw new NotFoundException('Domain not found');
    await this.domainRepository.remove(domain);
    return { message: 'Domain removed successfully' };
  }
}