import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemLog, LogStatus } from '../../database/entities/system-log.entity';

@Injectable()
export class SystemLogsService {
  constructor(
    @InjectRepository(SystemLog)
    private readonly logRepository: Repository<SystemLog>,
  ) {}

  // 1. Hàm để các service khác gọi khi muốn ghi log
  async createLog(data: {
    userId?: string;
    action: string;
    resource: string;
    message: string;
    details?: any;
    status?: LogStatus;
  }) {
    const log = this.logRepository.create({
      user: data.userId ? ({ id: data.userId } as any) : null,
      action: data.action,
      resource: data.resource,
      message: data.message,
      details: data.details,
      status: data.status || LogStatus.SUCCESS,
    });
    return this.logRepository.save(log);
  }

  // 2. Hàm cho Frontend lấy danh sách log hiển thị
  async findAll() {
    return this.logRepository.find({
      relations: ['user'], // Lấy thông tin người làm
      order: { createdAt: 'DESC' }, // Mới nhất lên đầu
    });
  }
}
