import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, MoreThan } from 'typeorm';
import * as os from 'os';
// 👇 Import from the shared database directory
import { AllowedDomain } from '../../database/entities/allowed-domain.entity';
import { User } from '../../database/entities/user.entity';

/**
 * Service handling administrative tasks, including domain management,
 * dashboard statistics, and system health monitoring.
 */
@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(AllowedDomain)
    private domainRepository: Repository<AllowedDomain>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Retrieves all allowed email domains, ordered by their creation date descending,
   * along with the count of active users registered under each domain.
   * 
   * @returns An object containing the list of allowed domains with their user counts
   */
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

  /**
   * Registers a new allowed email domain in the system.
   * 
   * @param domainName The domain string to allow (e.g., 'company.com')
   * @returns An object containing the newly created domain entity
   * @throws {ConflictException} If the domain already exists
   */
  async create(domainName: string) {
    const exists = await this.domainRepository.findOne({ where: { domain: domainName } });
    if (exists) throw new ConflictException('Domain already exists');

    const newDomain = this.domainRepository.create({
      domain: domainName,
      addedAt: new Date(),
    });
    return { domain: await this.domainRepository.save(newDomain) };
  }

  /**
   * Removes an allowed email domain by its ID.
   * 
   * Crucial safety checks:
   * 1. The domain must exist.
   * 2. The system must retain at least one allowed domain.
   * 3. No users must currently be registered under this domain.
   * 
   * @param id The UUID of the allowed domain to remove
   * @returns A success message
   * @throws {NotFoundException} If the domain does not exist
   * @throws {ConflictException} If it is the last domain or is still in use by active users
   */
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
  // ADMIN DASHBOARD: Aggregate statistics for the Dashboard
  // ======================================================
  
  /**
   * Compiles aggregate user statistics for the Admin Dashboard.
   * Includes total users, active users (within 30 days), and profile completion status.
   * 
   * @returns An object containing grouped statistics
   */
  async getDashboardStats() {
    const now = new Date();

    // 1. Total number of users
    const totalUsers = await this.userRepository.count();

    // 2. Users with incomplete profiles (profileCompleted = false)
    const incompleteProfileCount = await this.userRepository.count({
      where: { profileCompleted: false },
    });

    // 3. Active users in the last 30 days (updatedAt > 30 days ago)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const activeUsers = await this.userRepository.count({
      where: { updatedAt: MoreThan(thirtyDaysAgo) },
    });

    // 4. Users with completed profiles
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
  // SYSTEM HEALTH: CPU, RAM, Uptime from Node.js os module
  // ======================================================

  /**
   * Retrieves real-time server and process metrics.
   * Compiles CPU load, memory utilization, process details, and system uptime.
   * 
   * Note: CPU load is measured cross-platform (Windows & Unix) by calculating 
   * CPU ticks delta over a 150ms window.
   * 
   * @returns Comprehensive health metrics of the host system and the Node.js process
   */
  async getSystemHealth() {
    // --- RAM ---
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsagePercent = Math.round((usedMem / totalMem) * 100);

    // --- UPTIME (server uptime, not process uptime) ---
    const uptimeSeconds = os.uptime();
    const uptimeDays = Math.floor(uptimeSeconds / 86400);
    const uptimeHours = Math.floor((uptimeSeconds % 86400) / 3600);
    const uptimeMinutes = Math.floor((uptimeSeconds % 3600) / 60);

    // --- CPU USAGE (Cross-platform: Windows + Linux/Mac) ---
    // os.loadavg() always returns [0,0,0] on Windows -> must compute delta using os.cpus()
    const cpusBefore = os.cpus();
    await new Promise<void>((resolve) => setTimeout(resolve, 150)); // Measure delta over a 150ms window
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

    // --- Node.js Process Memory (RAM usage of Node application) ---
    const processMemory = process.memoryUsage();
    const heapUsedMB = Math.round(processMemory.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(processMemory.heapTotal / 1024 / 1024);
    const rssMB = Math.round(processMemory.rss / 1024 / 1024);

    return {
      cpu: {
        loadPercent: cpuLoadPercent,
        coreCount: cpuCount,
        model: os.cpus()[0]?.model || 'Unknown',
        measurementWindowMs: 150, // Measure delta in 150ms - cross-platform
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
