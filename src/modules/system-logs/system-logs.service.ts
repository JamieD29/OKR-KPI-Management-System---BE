import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemLog, LogStatus } from '../../database/entities/system-log.entity';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class SystemLogsService {
  private readonly logger = new Logger(SystemLogsService.name);

  constructor(
    @InjectRepository(SystemLog)
    private readonly logRepository: Repository<SystemLog>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
    // Kiểm tra user có tồn tại trong DB không, nếu không thì set null để tránh FK violation
    let userRef: { id: string } | null = null;
    if (data.userId) {
      const userExists = await this.userRepository.findOne({ where: { id: data.userId } });
      if (userExists) {
        userRef = { id: data.userId };
      } else {
        this.logger.warn(
          `User ID "${data.userId}" không tồn tại trong DB, ghi log với user = null`,
        );
      }
    }

    const log = this.logRepository.create({
      user: userRef as any,
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

  // 3. Xóa toàn bộ nhật ký (Giải phóng bộ nhớ)
  async clearAll() {
    await this.logRepository.clear();
  }
}
