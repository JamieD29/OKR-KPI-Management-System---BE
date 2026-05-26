import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, MoreThan } from 'typeorm';
import * as os from 'os';
// 👇 Import từ thư mục database chung
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
      }),
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
      where: { email: Like(`%@${domain.domain}`) },
    });

    if (usersUsingDomain > 0) {
      throw new ConflictException(
        `Không thể xóa! Có ${usersUsingDomain} nhân viên đang sử dụng tên miền này.`,
      );
    }

    await this.domainRepository.remove(domain);
    return { message: 'Domain removed successfully' };
  }

  // ======================================================
  // ADMIN DASHBOARD: Tổng hợp thống kê cho trang Dashboard
  // ======================================================
  async getDashboardStats() {
    const now = new Date();

    // 1. Tổng số users
    const totalUsers = await this.userRepository.count();

    // 2. Users chưa hoàn thành profile (profileCompleted = false)
    const incompleteProfileCount = await this.userRepository.count({
      where: { profileCompleted: false },
    });

    // 3. Users active trong 30 ngày gần đây (updatedAt > 30 ngày trước)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const activeUsers = await this.userRepository.count({
      where: { updatedAt: MoreThan(thirtyDaysAgo) },
    });

    // 4. Users đã hoàn thành profile
    const completedProfileCount = await this.userRepository.count({
      where: { profileCompleted: true },
    });

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        incompleteProfile: incompleteProfileCount,
        completedProfile: completedProfileCount,
      },
    };
  }

  // ======================================================
  // SYSTEM HEALTH: CPU, RAM, Uptime từ Node.js os module
  // ======================================================
  async getSystemHealth() {
    // --- RAM ---
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsagePercent = Math.round((usedMem / totalMem) * 100);

    // --- UPTIME (server uptime, không phải process uptime) ---
    const uptimeSeconds = os.uptime();
    const uptimeDays = Math.floor(uptimeSeconds / 86400);
    const uptimeHours = Math.floor((uptimeSeconds % 86400) / 3600);
    const uptimeMinutes = Math.floor((uptimeSeconds % 3600) / 60);

    // --- CPU USAGE (Cross-platform: Windows + Linux/Mac) ---
    // os.loadavg() luôn = [0,0,0] trên Windows → phải dùng os.cpus() delta
    const cpusBefore = os.cpus();
    await new Promise<void>((resolve) => setTimeout(resolve, 150)); // Đo trong 150ms
    const cpusAfter = os.cpus();
    const cpuCount = cpusBefore.length;

    let totalIdle = 0;
    let totalTick = 0;
    for (let i = 0; i < cpuCount; i++) {
      const before = cpusBefore[i].times;
      const after = cpusAfter[i].times;
      const idle = after.idle - before.idle;
      const total =
        (after.user - before.user) +
        (after.nice - before.nice) +
        (after.sys - before.sys) +
        (after.idle - before.idle) +
        (after.irq - before.irq);
      totalIdle += idle;
      totalTick += total;
    }
    const cpuLoadPercent = totalTick > 0
      ? Math.max(0, Math.min(100, Math.round(100 * (1 - totalIdle / totalTick))))
      : 0;

    // --- Node.js Process Memory (RAM của app Node) ---
    const processMemory = process.memoryUsage();
    const heapUsedMB = Math.round(processMemory.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(processMemory.heapTotal / 1024 / 1024);
    const rssMB = Math.round(processMemory.rss / 1024 / 1024);

    return {
      cpu: {
        loadPercent: cpuLoadPercent,
        coreCount: cpuCount,
        model: os.cpus()[0]?.model || 'Unknown',
        measurementWindowMs: 150, // Đo delta trong 150ms — cross-platform
      },
      memory: {
        totalBytes: totalMem,
        usedBytes: usedMem,
        freeBytes: freeMem,
        usagePercent: memUsagePercent,
        totalGB: Math.round((totalMem / 1024 / 1024 / 1024) * 10) / 10,
        usedGB: Math.round((usedMem / 1024 / 1024 / 1024) * 10) / 10,
        freeGB: Math.round((freeMem / 1024 / 1024 / 1024) * 10) / 10,
      },
      nodeProcess: {
        heapUsedMB,
        heapTotalMB,
        rssMB,
        heapUsagePercent: Math.round((heapUsedMB / heapTotalMB) * 100),
        pid: process.pid,
        nodeVersion: process.version,
      },
      uptime: {
        totalSeconds: Math.floor(uptimeSeconds),
        days: uptimeDays,
        hours: uptimeHours,
        minutes: uptimeMinutes,
        label: uptimeDays > 0
          ? `${uptimeDays} ngày ${uptimeHours} giờ ${uptimeMinutes} phút`
          : `${uptimeHours} giờ ${uptimeMinutes} phút`,
      },
      system: {
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
      },
      timestamp: new Date().toISOString(),
    };
  }
}
