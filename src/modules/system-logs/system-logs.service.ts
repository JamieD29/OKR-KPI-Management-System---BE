import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemLog, LogStatus } from '../../database/entities/system-log.entity';
import { User } from '../../database/entities/user.entity';

/**
 * Service handling system audit logs.
 * Records user actions, system actions, and provides query interfaces for log displays
 * and cleanups.
 */
@Injectable()
export class SystemLogsService {
  private readonly logger = new Logger(SystemLogsService.name);

  /**
   * @param logRepository Repository for SystemLog entity
   * @param userRepository Repository for User entity
   */
  constructor(
    @InjectRepository(SystemLog)
    private readonly logRepository: Repository<SystemLog>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Writes an audit log record into the database.
   * Validates user reference to avoid foreign key violations.
   * 
   * @param data Payload containing log details (userId, action, resource, message, details, status)
   * @returns The saved SystemLog entity
   */
  async createLog(data: {
    userId?: string;
    action: string;
    resource: string;
    message: string;
    details?: any;
    status?: LogStatus;
  }) {
    // Check if user exists in database; if not, set user to null to prevent Foreign Key (FK) constraint violation
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

  /**
   * Retrieves all system logs, including associated user records, 
   * ordered by creation date descending.
   * 
   * @returns Array of SystemLog entities
   */
  async findAll() {
    return this.logRepository.find({
      relations: ['user'], // Retrieve associated user info
      order: { createdAt: 'DESC' }, // Order by newest first
    });
  }

  /**
   * Truncates/clears all audit log records from the database.
   */
  async clearAll() {
    await this.logRepository.clear();
  }
}
