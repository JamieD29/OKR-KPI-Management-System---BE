import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Objective } from '../../database/entities/performance-evaluation/objective.entity';
import { UserOkr } from '../../database/entities/performance-evaluation/user-okr.entity';
import { UserEvaluation } from '../../database/entities/performance-evaluation/user-evaluation.entity';
import { EvaluationCycle, EvaluationStatus } from '../../database/entities/performance-evaluation/evaluation-cycle.entity';
import { NotificationService } from '../notification/notification.service';
import { User } from '../../database/entities/user.entity';
import { Department } from '../../database/entities/department.entity';

/**
 * Service managing Objective and Key Results (OKR) and Performance Evaluations.
 * Handles workflows for negotiation, self-reporting, manager review, auto-acceptance, 
 * auto-submission, and department/dean dashboard metrics.
 */
@Injectable()
export class OkrService {
  /**
   * @param objectiveRepo Repository for Objective entity
   * @param userOkrRepo Repository for UserOkr entity
   * @param userEvaluationRepo Repository for UserEvaluation entity
   * @param notificationService Service to create and dispatch notifications
   */
  constructor(
    @InjectRepository(Objective)
    private objectiveRepo: Repository<Objective>,
    @InjectRepository(UserOkr)
    private userOkrRepo: Repository<UserOkr>,
    @InjectRepository(UserEvaluation)
    private userEvaluationRepo: Repository<UserEvaluation>,
    private notificationService: NotificationService,
  ) {}

  /**
   * Internal helper to determine if the user has restricted access to a department.
   * If the user is an Admin, they have unrestricted access.
   * If the user is a division head ('DON_VI'), access is restricted to their own department.
   * 
   * @param userId The ID of the requesting user
   * @returns The restricted department ID or null if unrestricted
   */
  private async getRestrictDeptId(userId?: string): Promise<string | null> {
    if (!userId) return null;
    const user = await this.userOkrRepo.manager.getRepository(User).findOne({
      where: { id: userId },
      relations: ['managementPosition', 'department', 'roles'],
    });
    if (!user) return null;

    const isAdmin = user.roles?.some(r => r.slug === 'ADMIN');
    if (isAdmin) {
      return null;
    }

    if (user.managementPosition?.permissionLevel === 'DON_VI') {
      return user.department?.id || null;
    }
    return null;
  }

  /**
   * Creates a new department-level objective (Legacy).
   * 
   * @param data Department objective payload
   * @returns Saved Objective entity
   * @throws {InternalServerErrorException} If DB save fails
   */
  async createDepartmentOkr(data: any) {
    try {
      const newObjective = this.objectiveRepo.create({
        title: data.title,
        type: data.type,
        cycleId: data.cycleId,
        departmentId: data.departmentId,
        status: 'ON_TRACK',
        progress: 0,
        keyResults: data.keyResults,
      });
      return await this.objectiveRepo.save(newObjective);
    } catch (error) {
      throw new InternalServerErrorException(`Lỗi khi lưu OKR: ${error.message}`);
    }
  }

  /**
   * Retrieves all legacy department-level objectives.
   * 
   * @returns Array of department objectives
   */
  async getDepartmentOkrs() {
    return this.objectiveRepo.find({
      where: { type: 'DEPARTMENT' },
      relations: ['keyResults'],
      order: { createdAt: 'DESC' },
    });
  }

  // --- DEPARTMENT OVERVIEW ---

  /**
   * Compiles department overview statistics and user-level OKR/Evaluation statuses.
   * Enforces department-level boundaries for non-admin requests.
   * 
   * @param deptId Target department ID
   * @param userId Requesting user ID for RBAC validation
   * @param cycleId Evaluation cycle filter
   * @returns Aggregated department metrics, members list, and status tables
   * @throws {BadRequestException} If the user lacks access to the requested department
   * @throws {NotFoundException} If the department does not exist
   */
  async getDepartmentOverview(deptId: string, userId: string, cycleId?: string) {
    // 1. RBAC Check
    const restrictDeptId = await this.getRestrictDeptId(userId);
    if (restrictDeptId && restrictDeptId !== deptId) {
      throw new BadRequestException('Bạn không có quyền xem tổng quan của bộ môn này');
    }

    // 2. Retrieve Department details
    const departmentRepo = this.userOkrRepo.manager.getRepository(Department);
    const department = await departmentRepo.findOne({
      where: { id: deptId },
      relations: ['users'],
    });

    if (!department) {
      throw new NotFoundException('Không tìm thấy bộ môn');
    }

    // 3. Retrieve Department Objectives
    const whereCondition: any = { departmentId: deptId, type: 'DEPARTMENT' };
    if (cycleId) {
      whereCondition.cycleId = cycleId;
    }
    const objectives = await this.objectiveRepo.find({
      where: whereCondition,
      relations: ['keyResults'],
      order: { createdAt: 'DESC' },
    });

    // 4. Retrieve list of members and detailed OKR data
    const memberIds = department.users ? department.users.map(u => u.id) : [];

    let actionRequiredCount = 0;
    let totalOkrs = 0;
    let completedOrSubmitted = 0;
    const staffOkrStatus: any[] = [];
    const staffEvaluationStatus: any[] = [];

    if (memberIds.length > 0) {
      // --- OKR Status per staff ---
      const okrWhere: any = { userId: In(memberIds) };
      if (cycleId) okrWhere.cycleId = cycleId;

      const userOkrs = await this.userOkrRepo.find({
        where: okrWhere,
        relations: ['user', 'cycle'],
      });

      totalOkrs = userOkrs.length;

      // Group OKRs by user
      const okrsByUser = new Map<string, any[]>();
      for (const okr of userOkrs) {
        if (okr.status === 'AT_RISK' || okr.status === 'OFF_TRACK' || okr.status === 'PENDING' || okr.status === 'NEGOTIATING') {
          actionRequiredCount++;
        }
        if (okr.status === 'COMPLETED' || okr.status === 'SUBMITTED') {
          completedOrSubmitted++;
        }

        if (!okrsByUser.has(okr.userId)) {
          okrsByUser.set(okr.userId, []);
        }
        okrsByUser.get(okr.userId)!.push(okr);
      }

      // Build staffOkrStatus for each member
      if (department.users) {
        for (const user of department.users) {
          const userOkrList = okrsByUser.get(user.id) || [];
          staffOkrStatus.push({
            userId: user.id,
            name: user.name || user.email,
            email: user.email,
            avatar: user.avatarUrl,
            okrs: userOkrList.map(okr => ({
              id: okr.id,
              objective: okr.objective,
              status: okr.status,
              totalScore: okr.totalScore || 0,
              managerScore: okr.managerScore || null,
              cycleName: okr.cycle?.name || null,
            })),
          });
        }
      }

      // --- Evaluation Status per staff ---
      const evalWhere: any = { userId: In(memberIds) };
      if (cycleId) evalWhere.cycleId = cycleId;

      const userEvaluations = await this.userEvaluationRepo.find({
        where: evalWhere,
        relations: ['user', 'cycle'],
      });

      // Group evaluations by user — take the latest one per user
      const evalByUser = new Map<string, any>();
      for (const ev of userEvaluations) {
        const existing = evalByUser.get(ev.userId);
        if (!existing || new Date(ev.updatedAt) > new Date(existing.updatedAt)) {
          evalByUser.set(ev.userId, ev);
        }
      }

      if (department.users) {
        for (const user of department.users) {
          const ev = evalByUser.get(user.id);
          staffEvaluationStatus.push({
            userId: user.id,
            name: user.name || user.email,
            email: user.email,
            avatar: user.avatarUrl,
            status: ev?.status || null,
            selfRating: ev?.selfRating || null,
            managerRating: ev?.managerRating || null,
            selfScoreTotal: ev?.selfScoreTotal || 0,
            principalScoreTotal: ev?.principalScoreTotal || 0,
            cycleName: ev?.cycle?.name || null,
          });
        }
      }
    }

    const completionRate = totalOkrs > 0
      ? Math.round((completedOrSubmitted / totalOkrs) * 1000) / 10
      : 0;

    return {
      department: {
        id: department.id,
        name: department.name,
        code: department.code,
        memberCount: memberIds.length,
      },
      metrics: {
        totalOkrs,
        completionRate,
        actionRequired: actionRequiredCount,
      },
      objectives,
      staffOkrStatus: staffOkrStatus.sort((a, b) => b.okrs.length - a.okrs.length),
      staffEvaluationStatus,
    };
  }

  // --- LAZY DEADLINE EVALUATION ---

  /**
   * Checks deadlines and automatically locks/accepts expired OKRs.
   * If deadline < now and status is PENDING or NEGOTIATING, the status
   * changes to ACCEPTED and user is notified.
   * 
   * @param okrs UserOkr array to process
   * @returns Processed UserOkr array
   */
  private async checkAndAutoAcceptExpired(okrs: UserOkr[]): Promise<UserOkr[]> {
    const now = new Date();
    const updated: UserOkr[] = [];

    for (const okr of okrs) {
      if (
        okr.deadline &&
        new Date(okr.deadline) < now &&
        (okr.status === 'PENDING' || okr.status === 'NEGOTIATING')
      ) {
        okr.status = 'ACCEPTED';
        okr.acceptedAt = now;
        await this.userOkrRepo.save(okr);

        // Notify user of auto-acceptance
        await this.notificationService.create(
          okr.userId,
          `⏰ OKR "${okr.objective}" đã được tự động chốt do hết hạn đàm phán (${new Date(okr.deadline).toLocaleDateString('vi-VN')}). Phiên bản mới nhất đã được áp dụng.`,
        );

        updated.push(okr);
      }
    }

    if (updated.length > 0) {
      console.log(`⏰ Auto-accepted ${updated.length} expired OKR(s)`);
    }

    return okrs;
  }

  /**
   * Checks if the negotiation deadline for a given OKR has expired.
   * 
   * @param okr UserOkr entity
   * @returns True if current time is past negotiation deadline
   */
  private isDeadlineExpired(okr: UserOkr): boolean {
    if (!okr.deadline) return false;
    return new Date(okr.deadline) < new Date();
  }

  /**
   * Auto-submits unsubmitted OKR self-reports and quality evaluations when a cycle ends/closes.
   * Converts ACCEPTED OKRs to SUBMITTED and calculates scores.
   * Converts PENDING_EVALUATION sheets to SUBMITTED.
   */
  private async checkAndAutoSubmitAllExpiredReports(): Promise<void> {
    try {
      const now = new Date();
      const cycles = await this.userOkrRepo.manager.getRepository(EvaluationCycle).find({
        where: { isDel: false },
      });
      
      const closedCycleIds = cycles
        .filter(c => c.status === EvaluationStatus.CLOSED || (c.endDate && new Date(c.endDate) < now))
        .map(c => c.id);

      if (closedCycleIds.length === 0) return;

      // 1. Auto-submit ACCEPTED OKRs for users in expired/closed cycles
      const okrs = await this.userOkrRepo.find({
        where: {
          cycleId: In(closedCycleIds),
          status: 'ACCEPTED',
        },
      });

      for (const okr of okrs) {
        okr.status = 'SUBMITTED';
        okr.selfReportData = okr.selfReportData || {};
        okr.totalScore = this.calculateOkrScore(okr.keyResults, okr.selfReportData);
        await this.userOkrRepo.save(okr);

        await this.notificationService.create(
          okr.userId,
          `⏰ OKR "${okr.objective}" của bạn đã được hệ thống tự động nộp tự khai điểm (${okr.totalScore} điểm) do hết hạn kỳ đánh giá.`,
        );
      }

      // 2. Auto-submit quality evaluation forms in PENDING_EVALUATION state
      const evs = await this.userEvaluationRepo.find({
        where: {
          cycleId: In(closedCycleIds),
          status: 'PENDING_EVALUATION',
        },
      });

      for (const ev of evs) {
        ev.status = 'SUBMITTED';
        ev.selfComment = ev.selfComment || 'Hệ thống tự động nộp do quá hạn kỳ đánh giá.';
        ev.selfRating = ev.selfRating || 'GOOD';
        await this.userEvaluationRepo.save(ev);

        await this.notificationService.create(
          ev.userId,
          `⏰ Phiếu Đánh Giá chất lượng của bạn đã được hệ thống tự động nộp do hết hạn kỳ đánh giá. Trạng thái: Chờ duyệt.`,
        );
      }
    } catch (err) {
      console.error('Lỗi khi chạy tự động nộp OKR/Phiếu đánh giá quá hạn toàn hệ thống:', err);
    }
  }

  // --- OKR NEGOTIATION + SELF-REPORT WORKFLOW ---

  /**
   * Retrieves OKRs belonging to the requesting user.
   * Performs housekeeping (auto-submits expired cycles, auto-accepts expired negotiations).
   * 
   * @param userId User ID
   * @returns Array of processed UserOkr records
   */
  async getMyOkrs(userId: string) {
    // Auto-submit expired reviews if cycle is closed or past its end date
    await this.checkAndAutoSubmitAllExpiredReports();

    const okrs = await this.userOkrRepo.find({
      where: { userId },
      relations: ['cycle'],
      order: { createdAt: 'DESC' },
    });

    // Lazy check: auto-accept if negotiation deadline is expired
    return this.checkAndAutoAcceptExpired(okrs);
  }

  /**
   * Lists user IDs assigned to a specific cycle.
   * 
   * @param cycleId Evaluation cycle ID
   * @returns Array of user IDs
   */
  async getAssignedUsersInCycle(cycleId: string): Promise<string[]> {
    const okrs = await this.userOkrRepo.find({
      where: { cycleId },
      select: ['userId'],
    });
    return okrs.map(o => o.userId);
  }

  /**
   * Retrieves pending OKR negotiation requests.
   * Non-admin roles are restricted to their own department.
   * 
   * @param requesterId The user fetching pending requests
   * @returns Array of pending UserOkr records
   */
  async getPendingApproval(requesterId?: string) {
    const restrictDeptId = await this.getRestrictDeptId(requesterId);

    const okrs = await this.userOkrRepo.find({
      where: [
        { status: 'NEGOTIATING' },
        { status: 'PENDING' },
      ],
      relations: ['user', 'user.department', 'user.managementPosition', 'cycle'],
      order: { createdAt: 'DESC' },
    });

    // Lazy check: auto-accept expired, then filter to return active negotiations
    await this.checkAndAutoAcceptExpired(okrs);

    let filtered = okrs.filter(o => o.status === 'NEGOTIATING' || o.status === 'PENDING');
    if (restrictDeptId) {
      filtered = filtered.filter(o => o.user?.department?.id === restrictDeptId);
    }
    return filtered;
  }

  /**
   * Marks an OKR template as accepted by the user, initiating negotiation.
   * Sets status to NEGOTIATING and alerts relevant administrators.
   * 
   * @param id UserOkr ID
   * @param userId The accepting user's ID
   * @returns Saved UserOkr record
   * @throws {NotFoundException} If the OKR is not found
   */
  async acceptOkr(id: string, userId: string) {
    const okr = await this.userOkrRepo.findOne({ 
      where: { id, userId },
      relations: ['user', 'user.department']
    });
    if (!okr) throw new NotFoundException('OKR not found');
    
    // Change status to NEGOTIATING to await manager approval
    okr.status = 'NEGOTIATING';
    
    const saved = await this.userOkrRepo.save(okr);

    // Send notifications to Admin and Dean/Vice Dean/Department Head
    try {
      const managers = await this.userOkrRepo.manager.getRepository(User).find({
        relations: ['roles', 'managementPosition'],
      });

      const targetManagers = managers.filter(u => 
        u.roles.some(r => r.slug === 'ADMIN') || 
        (u.managementPosition && (
          u.managementPosition.permissionLevel !== 'NONE' ||
          ['TRUONG_KHOA', 'PHO_TRUONG_KHOA', 'TRUONG_BO_MON', 'PHO_TRUONG_BO_MON'].includes(u.managementPosition.slug)
        ))
      );

      const senderName = okr.user?.name || okr.user?.email || 'Nhân sự';
      const deptName = okr.user?.department?.name ? ` thuộc bộ môn ${okr.user.department.name}` : '';
      const message = `🔔 ${senderName}${deptName} đã đồng ý chấp nhận OKR "${okr.objective}". Vui lòng phê duyệt để hoàn thành đàm phán.`;

      for (const manager of targetManagers) {
        if (manager.id !== userId) {
          await this.notificationService.create(manager.id, message);
        }
      }
    } catch (err) {
      console.error('Lỗi gửi thông báo cho quản lý khi user đồng ý chấp nhận OKR:', err);
    }

    return saved;
  }

  /**
   * Submits the OKR template or adjustments for manager review.
   * 
   * @param id UserOkr ID
   * @param userId Requesting user ID
   * @returns Saved UserOkr record
   * @throws {NotFoundException} If the OKR is not found
   * @throws {BadRequestException} If negotiation deadline is expired or state is invalid
   */
  async sendForApproval(id: string, userId: string) {
    const okr = await this.userOkrRepo.findOne({ 
      where: { id, userId },
      relations: ['user', 'user.department']
    });
    if (!okr) throw new NotFoundException('OKR not found');

    if (this.isDeadlineExpired(okr)) {
      throw new BadRequestException(
        `Đã hết hạn đàm phán (${new Date(okr.deadline!).toLocaleDateString('vi-VN')}). Không thể gửi yêu cầu duyệt.`,
      );
    }

    if (okr.status !== 'PENDING' && okr.status !== 'NEGOTIATING') {
      throw new BadRequestException('Chỉ có thể gửi yêu cầu duyệt khi đang đàm phán hoặc chờ phản hồi.');
    }

    okr.status = 'NEGOTIATING';
    const saved = await this.userOkrRepo.save(okr);

    // Send notifications to Admin and Dean/Vice Dean
    try {
      const managers = await this.userOkrRepo.manager.getRepository(User).find({
        relations: ['roles', 'managementPosition'],
      });

      const targetManagers = managers.filter(u => 
        u.roles.some(r => r.slug === 'ADMIN') || 
        (u.managementPosition && (
          u.managementPosition.permissionLevel !== 'NONE' ||
          ['TRUONG_KHOA', 'PHO_TRUONG_KHOA', 'TRUONG_BO_MON', 'PHO_TRUONG_BO_MON'].includes(u.managementPosition.slug)
        ))
      );

      const senderName = okr.user?.name || okr.user?.email || 'Nhân sự';
      const deptName = okr.user?.department?.name ? ` thuộc bộ môn ${okr.user.department.name}` : '';
      const message = `🔔 ${senderName}${deptName} đã gửi yêu cầu xét duyệt OKR "${okr.objective}".`;

      for (const manager of targetManagers) {
        if (manager.id !== userId) {
          await this.notificationService.create(manager.id, message);
        }
      }
    } catch (err) {
      console.error('Lỗi gửi thông báo cho quản lý khi duyệt OKR:', err);
    }

    return saved;
  }

  /**
   * Adds a comment to a specific Key Result item during negotiation.
   * 
   * @param id UserOkr ID
   * @param itemId Targeted Key Result item ID
   * @param sender The sender identity ('USER' or 'MANAGER')
   * @param message Comment message
   * @returns Saved UserOkr record with updated proposed changes
   * @throws {NotFoundException} If the OKR is not found
   * @throws {BadRequestException} If a user attempts to comment after deadline
   */
  async chatItem(id: string, itemId: string, sender: 'USER' | 'MANAGER', message: string) {
    const okr = await this.userOkrRepo.findOne({ 
      where: { id },
      relations: ['user', 'user.department']
    });
    if (!okr) throw new NotFoundException('OKR not found');

    // Block negotiation if deadline is expired (restricted for user, allowed for manager)
    if (sender === 'USER' && this.isDeadlineExpired(okr)) {
      throw new BadRequestException(
        `Đã hết hạn đàm phán (${new Date(okr.deadline!).toLocaleDateString('vi-VN')}). Không thể gửi đề xuất mới.`,
      );
    }

    const changes = okr.proposedChanges || {};
    if (!changes[itemId]) {
      changes[itemId] = [];
    }

    changes[itemId].push({
      sender,
      message,
      createdAt: new Date().toISOString()
    });

    okr.proposedChanges = changes;
    
    // Status only updates when the user clicks submit modifications/review.
    const saved = await this.userOkrRepo.save(okr);

    // If manager replies in negotiation (chat comment), notify the user
    if (sender === 'MANAGER') {
      try {
        const messageStr = `💬 Người giao OKR đã phản hồi yêu cầu đề xuất điều chỉnh OKR "${okr.objective}" của bạn.`;
        await this.notificationService.create(okr.userId, messageStr);
      } catch (err) {
        console.error('Lỗi gửi thông báo comment từ manager:', err);
      }
    }

    // If user replies in negotiation (chat comment), notify the manager
    if (sender === 'USER') {
      try {
        const managers = await this.userOkrRepo.manager.getRepository(User).find({
          relations: ['roles', 'managementPosition'],
        });

        const targetManagers = managers.filter(u => 
          u.roles.some(r => r.slug === 'ADMIN') || 
          (u.managementPosition && (
            u.managementPosition.permissionLevel !== 'NONE' ||
            ['TRUONG_KHOA', 'PHO_TRUONG_KHOA', 'TRUONG_BO_MON', 'PHO_TRUONG_BO_MON'].includes(u.managementPosition.slug)
          ))
        );

        const senderName = okr.user?.name || okr.user?.email || 'Nhân sự';
        const deptName = okr.user?.department?.name ? ` thuộc bộ môn ${okr.user.department.name}` : '';
        const messageStr = `💬 ${senderName}${deptName} đã phản hồi đề xuất điều chỉnh OKR "${okr.objective}".`;

        for (const manager of targetManagers) {
          if (manager.id !== okr.userId) {
            await this.notificationService.create(manager.id, messageStr);
          }
        }
      } catch (err) {
        console.error('Lỗi gửi thông báo comment từ user:', err);
      }
    }

    return saved;
  }

  /**
   * Modifies structural weights (maxScore, unitScore) of an OKR item recursively.
   * Deep-clones the original structure prior to editing.
   * 
   * @param id UserOkr ID
   * @param itemId Target item ID
   * @param updates Object containing updates for maxScore or unitScore
   * @returns Saved UserOkr record
   * @throws {NotFoundException} If OKR is not found
   */
  async updateItemProperties(id: string, itemId: string, updates: any) {
    const okr = await this.userOkrRepo.findOne({ where: { id } });
    if (!okr) throw new NotFoundException('OKR not found');

    const updateRecursive = (items: any[]) => {
      if (!items) return false;
      for (const item of items) {
        if (item.id === itemId) {
          if (updates.maxScore !== undefined) item.maxScore = updates.maxScore;
          if (updates.unitScore !== undefined) item.unitScore = updates.unitScore;
          return true;
        }
        if (item.items && updateRecursive(item.items)) {
          return true;
        }
      }
      return false;
    };

    if (okr.keyResults) {
      const changes = okr.proposedChanges || {};
      if (!changes.originalStructure) {
        // Deep clone keyResults before editing
        changes.originalStructure = JSON.parse(JSON.stringify(okr.keyResults));
      }

      updateRecursive(okr.keyResults);
      okr.proposedChanges = changes;
    }

    await this.userOkrRepo.save(okr);
    return okr;
  }

  /**
   * Updates the overall OKR Key Result structure as proposed by the user.
   * Safely backs up the original structure before overwrite.
   * 
   * @param id UserOkr ID
   * @param userId Requesting user ID
   * @param keyResults Proposed structural array
   * @param localComments Local comments history mapping
   * @returns Saved UserOkr record
   * @throws {NotFoundException} If the OKR is not found
   * @throws {BadRequestException} If past deadline or state is not under negotiation
   */
  async updateOkrStructure(id: string, userId: string, keyResults: any[], localComments?: Record<string, any[]>) {
    const okr = await this.userOkrRepo.findOne({ 
      where: { id, userId },
      relations: ['user', 'user.department']
    });
    if (!okr) throw new NotFoundException('OKR not found');
    
    if (okr.status !== 'PENDING' && okr.status !== 'NEGOTIATING') {
      throw new BadRequestException('Chỉ có thể thay đổi cấu trúc khi đang đàm phán.');
    }

    // Block structure changes if negotiation deadline has expired
    if (this.isDeadlineExpired(okr)) {
      throw new BadRequestException(
        `Đã hết hạn đàm phán (${new Date(okr.deadline!).toLocaleDateString('vi-VN')}). Không thể thay đổi cấu trúc OKR.`,
      );
    }

    // Backup original structure before overwrite, if not already backed up
    const changes = okr.proposedChanges || {};
    if (!changes.originalStructure) {
      changes.originalStructure = JSON.parse(JSON.stringify(okr.keyResults));
    }

    // Merge local comments if any
    if (localComments) {
      for (const [itemId, messages] of Object.entries(localComments)) {
        if (!changes[itemId]) changes[itemId] = [];
        changes[itemId].push(...messages);
      }
    }

    okr.keyResults = keyResults;
    okr.proposedChanges = changes;
    okr.status = 'NEGOTIATING';
    
    const saved = await this.userOkrRepo.save(okr);

    // Send notifications to Admin and Dean/Vice Dean when submitting adjustment proposal
    try {
      const managers = await this.userOkrRepo.manager.getRepository(User).find({
        relations: ['roles', 'managementPosition'],
      });

      const targetManagers = managers.filter(u => 
        u.roles.some(r => r.slug === 'ADMIN') || 
        (u.managementPosition && (
          u.managementPosition.permissionLevel !== 'NONE' ||
          ['TRUONG_KHOA', 'PHO_TRUONG_KHOA', 'TRUONG_BO_MON', 'PHO_TRUONG_BO_MON'].includes(u.managementPosition.slug)
        ))
      );

      const senderName = okr.user?.name || okr.user?.email || 'Nhân sự';
      const deptName = okr.user?.department?.name ? ` thuộc bộ môn ${okr.user.department.name}` : '';
      const message = `🔔 ${senderName}${deptName} đã gửi đề xuất điều chỉnh OKR "${okr.objective}".`;

      for (const manager of targetManagers) {
        if (manager.id !== userId) {
          await this.notificationService.create(manager.id, message);
        }
      }
    } catch (err) {
      console.error('Lỗi gửi thông báo cho quản lý khi đề xuất OKR:', err);
    }

    return saved;
  }

  /**
   * Updates the OKR Key Result structure as proposed by the manager.
   * Reverts status to PENDING for the user to confirm/accept.
   * 
   * @param id UserOkr ID
   * @param managerId Assigner manager's ID
   * @param keyResults Updated structure
   * @param localComments Local comments mapping
   * @param originalStructure Original structure backup override
   * @returns Saved UserOkr record
   * @throws {NotFoundException} If the OKR is not found
   * @throws {BadRequestException} If not in negotiation phase
   */
  async managerUpdateOkrStructure(
    id: string, 
    managerId: string, 
    keyResults: any[], 
    localComments?: Record<string, any[]>,
    originalStructure?: any[]
  ) {
    const okr = await this.userOkrRepo.findOne({ where: { id } });
    if (!okr) throw new NotFoundException('OKR not found');
    
    if (okr.status !== 'PENDING' && okr.status !== 'NEGOTIATING') {
      throw new BadRequestException('Chỉ có thể thay đổi cấu trúc khi đang đàm phán.');
    }

    const changes = okr.proposedChanges || {};
    if (originalStructure) {
      changes.originalStructure = originalStructure;
    } else if (!changes.originalStructure) {
      changes.originalStructure = okr.keyResults;
    }

    // Merge local comments if any
    if (localComments) {
      for (const [itemId, messages] of Object.entries(localComments)) {
        if (!changes[itemId]) changes[itemId] = [];
        changes[itemId].push(...messages);
      }
    }

    okr.keyResults = keyResults;
    okr.proposedChanges = changes;
    okr.status = 'PENDING'; // Awaiting user confirmation

    const saved = await this.userOkrRepo.save(okr);

    // Send notification to user that the OKR assigner has replied to the proposal
    try {
      const message = `💬 Người giao OKR đã phản hồi yêu cầu đề xuất điều chỉnh OKR "${okr.objective}" của bạn.`;
      await this.notificationService.create(okr.userId, message);
    } catch (err) {
      console.error('Lỗi gửi thông báo cho user khi manager phản hồi OKR:', err);
    }

    return saved;
  }

  // --- EXTEND DEADLINE (For Dean) ---

  /**
   * Extends the negotiation deadline for an OKR.
   * 
   * @param id UserOkr ID
   * @param newDeadline Target extension date
   * @returns Saved UserOkr record
   * @throws {NotFoundException} If the OKR is not found
   * @throws {BadRequestException} If the OKR has already been accepted or finalized
   */
  async extendDeadline(id: string, newDeadline: Date) {
    const okr = await this.userOkrRepo.findOne({ where: { id } });
    if (!okr) throw new NotFoundException('OKR not found');

    if (okr.status === 'ACCEPTED' || okr.status === 'SUBMITTED' || okr.status === 'COMPLETED') {
      throw new BadRequestException('Không thể gia hạn OKR đã được chốt hoặc đã hoàn thành.');
    }

    const oldDeadline = okr.deadline
      ? new Date(okr.deadline).toLocaleDateString('vi-VN')
      : 'Không có';

    okr.deadline = newDeadline;
    await this.userOkrRepo.save(okr);

    // Send notification to user
    await this.notificationService.create(
      okr.userId,
      `📅 Deadline đàm phán OKR "${okr.objective}" đã được gia hạn: ${oldDeadline} → ${new Date(newDeadline).toLocaleDateString('vi-VN')}.`,
    );

    return okr;
  }

  /**
   * Approves and locks the current OKR structure.
   * Reverts status to ACCEPTED.
   * 
   * @param id UserOkr ID
   * @returns Saved UserOkr record
   * @throws {NotFoundException} If the OKR is not found
   */
  async approveOkr(id: string) {
    const okr = await this.userOkrRepo.findOne({ where: { id } });
    if (!okr) throw new NotFoundException('OKR not found');

    okr.status = 'ACCEPTED';
    okr.acceptedAt = new Date();
    
    // Remove original backup since the new structure is approved
    if (okr.proposedChanges && okr.proposedChanges.originalStructure) {
      delete okr.proposedChanges.originalStructure;
    }

    await this.userOkrRepo.save(okr);
    await this.notificationService.create(
      okr.userId,
      `✅ Đề xuất điều chỉnh OKR "${okr.objective}" đã được duyệt!`,
    );
    return okr;
  }

  /**
   * Rejects the proposed OKR modifications and restores the previous structure.
   * Sets status back to PENDING.
   * 
   * @param id UserOkr ID
   * @param reason Rejection message reason
   * @returns Saved UserOkr record
   * @throws {NotFoundException} If the OKR is not found
   */
  async rejectOkr(id: string, reason: string) {
    const okr = await this.userOkrRepo.findOne({ where: { id } });
    if (!okr) throw new NotFoundException('OKR not found');

    okr.status = 'PENDING';
    
    // Restore the original version if a backup exists
    if (okr.proposedChanges && okr.proposedChanges.originalStructure) {
      okr.keyResults = okr.proposedChanges.originalStructure;
      delete okr.proposedChanges.originalStructure;
    }

    await this.userOkrRepo.save(okr);
    await this.notificationService.create(
      okr.userId,
      `❌ Đề xuất OKR "${okr.objective}" bị từ chối: ${reason}`,
    );
    return okr;
  }

  // --- SELF-REPORT: User self-reports score ---

  /**
   * Computes the aggregated score of an OKR template according to weight structures and quantities.
   * Caps objective and sub-level scores by their designated maxScores.
   * 
   * Supports structural levels up to Level 4 (Sub-Sub-KR).
   * 
   * @param structure OKR Key Result structure array
   * @param reportData Self-reported quantity values mapping
   * @returns Aggregated score points sum
   */
  private calculateOkrScore(structure: any[], reportData: any): number {
    if (!structure || !Array.isArray(structure)) return 0;
    if (!reportData || typeof reportData !== 'object') return 0;

    let grandTotal = 0;

    for (const obj of structure) {
      let objRawScore = 0;
      const maxObjScore = Number(obj.maxScore) || 0;

      if (obj.items && Array.isArray(obj.items)) {
        for (const kr of obj.items) {
          const krKey = `${obj.id}-${kr.id}`;
          const krData = reportData[krKey];
          const krQty = krData ? (Number(krData.quantity) || 0) : 0;
          const krUnitScore = Number(kr.unitScore) || 0;
          
          const krCalcScore = krUnitScore > 0 ? krQty * krUnitScore : krQty;
          const krCappedScore = Math.min(krCalcScore, Number(kr.maxScore) || Infinity);
          objRawScore += krCappedScore;

          if (kr.items && Array.isArray(kr.items)) {
             for (const sub of kr.items) {
               const subKey = `${obj.id}-${kr.id}-${sub.id}`;
               const subData = reportData[subKey];
               const subQty = subData ? (Number(subData.quantity) || 0) : 0;
               const subUnitScore = Number(sub.unitScore) || 0;
               
               const subCalcScore = subUnitScore > 0 ? subQty * subUnitScore : subQty;
               const subCappedScore = Math.min(subCalcScore, Number(sub.maxScore) || Infinity);
               objRawScore += subCappedScore;

               // Incorporate scoring for Sub-Sub-KR (Level 4)
               if (sub.items && Array.isArray(sub.items)) {
                 for (const subsub of sub.items) {
                   const subsubKey = `${obj.id}-${kr.id}-${sub.id}-${subsub.id}`;
                   const subsubData = reportData[subsubKey];
                   const subsubQty = subsubData ? (Number(subsubData.quantity) || 0) : 0;
                   const subsubUnitScore = Number(subsub.unitScore) || 0;
                   
                   const subsubCalcScore = subsubUnitScore > 0 ? subsubQty * subsubUnitScore : subsubQty;
                   const subsubCappedScore = Math.min(subsubCalcScore, Number(subsub.maxScore) || Infinity);
                   objRawScore += subsubCappedScore;
                 }
               }
             }
          }
        }
      }
      const objScore = maxObjScore > 0 ? Math.min(objRawScore, maxObjScore) : objRawScore;
      grandTotal += objScore;
    }

    return grandTotal;
  }

  /**
   * Extract function to calculate score of a single Objective for use in Evaluation Form.
   * 
   * @param obj Single objective structure item
   * @param reportData Quantity reports mapping
   * @returns Calculated score capped at objective's max score
   */
  private calcSingleObjectiveScore(obj: any, reportData: any): number {
    let objRawScore = 0;
    const maxObjScore = Number(obj.maxScore) || 0;

    if (obj.items && Array.isArray(obj.items)) {
      for (const kr of obj.items) {
        const krKey = `${obj.id}-${kr.id}`;
        const krData = reportData[krKey];
        const krQty = krData ? (Number(krData.quantity) || 0) : 0;
        const krUnitScore = Number(kr.unitScore) || 0;
        
        const krCalcScore = krUnitScore > 0 ? krQty * krUnitScore : krQty;
        const krCappedScore = Math.min(krCalcScore, Number(kr.maxScore) || Infinity);
        objRawScore += krCappedScore;

        if (kr.items && Array.isArray(kr.items)) {
           for (const sub of kr.items) {
             const subKey = `${obj.id}-${kr.id}-${sub.id}`;
             const subData = reportData[subKey];
             const subQty = subData ? (Number(subData.quantity) || 0) : 0;
             const subUnitScore = Number(sub.unitScore) || 0;
             
             const subCalcScore = subUnitScore > 0 ? subQty * subUnitScore : subQty;
             const subCappedScore = Math.min(subCalcScore, Number(sub.maxScore) || Infinity);
             objRawScore += subCappedScore;

             // Incorporate scoring for Sub-Sub-KR (Level 4)
             if (sub.items && Array.isArray(sub.items)) {
               for (const subsub of sub.items) {
                 const subsubKey = `${obj.id}-${kr.id}-${sub.id}-${subsub.id}`;
                 const subsubData = reportData[subsubKey];
                 const subsubQty = subsubData ? (Number(subsubData.quantity) || 0) : 0;
                 const subsubUnitScore = Number(subsub.unitScore) || 0;
                 
                 const subsubCalcScore = subsubUnitScore > 0 ? subsubQty * subsubUnitScore : subsubQty;
                 const subsubCappedScore = Math.min(subsubCalcScore, Number(subsub.maxScore) || Infinity);
                 objRawScore += subsubCappedScore;
               }
             }
           }
        }
      }
    }
    return maxObjScore > 0 ? Math.min(objRawScore, maxObjScore) : objRawScore;
  }

  /**
   * User submits their final self-report.
   * Computes user's self score, saves report, and flags status to SUBMITTED.
   * 
   * @param id UserOkr ID
   * @param userId Submitting user ID
   * @param selfReportData Quantification data mapping
   * @returns Saved UserOkr record
   * @throws {NotFoundException} If the OKR is not found
   * @throws {BadRequestException} If the OKR structure was never accepted/locked
   */
  async submitSelfReport(id: string, userId: string, selfReportData: any) {
    const okr = await this.userOkrRepo.findOne({ 
      where: { id, userId },
      relations: ['user', 'user.department']
    });
    if (!okr) throw new NotFoundException('OKR not found');
    if (okr.status !== 'ACCEPTED') {
      throw new BadRequestException('OKR chưa được chấp nhận, không thể tự khai.');
    }

    okr.selfReportData = selfReportData;
    okr.status = 'SUBMITTED';

    okr.totalScore = this.calculateOkrScore(okr.keyResults, selfReportData);

    const saved = await this.userOkrRepo.save(okr);

    // Send notification to managers/admins when self-report is submitted
    try {
      const managers = await this.userOkrRepo.manager.getRepository(User).find({
        relations: ['roles', 'managementPosition'],
      });

      const targetManagers = managers.filter(u => 
        u.roles.some(r => r.slug === 'ADMIN') || 
        (u.managementPosition && (
          u.managementPosition.permissionLevel !== 'NONE' ||
          ['TRUONG_KHOA', 'PHO_TRUONG_KHOA', 'TRUONG_BO_MON', 'PHO_TRUONG_BO_MON'].includes(u.managementPosition.slug)
        ))
      );

      const senderName = okr.user?.name || okr.user?.email || 'Nhân sự';
      const deptName = okr.user?.department?.name ? ` thuộc bộ môn ${okr.user.department.name}` : '';
      const message = `🔔 ${senderName}${deptName} đã nộp tự khai điểm OKR "${okr.objective}" (${okr.totalScore} điểm).`;

      for (const manager of targetManagers) {
        if (manager.id !== userId) {
          await this.notificationService.create(manager.id, message);
        }
      }
    } catch (err) {
      console.error('Lỗi gửi thông báo cho quản lý khi nộp tự khai điểm OKR:', err);
    }

    return saved;
  }

  /**
   * User saves a draft of their self-report.
   * Calculates score so the UI can show updated points immediately without submitting.
   * 
   * @param id UserOkr ID
   * @param userId Requesting user ID
   * @param selfReportData Valuation payload
   * @returns Saved UserOkr record
   * @throws {NotFoundException} If the OKR is not found
   * @throws {BadRequestException} If the OKR has not been accepted
   */
  async draftSelfReport(id: string, userId: string, selfReportData: any) {
    const okr = await this.userOkrRepo.findOne({ where: { id, userId } });
    if (!okr) throw new NotFoundException('OKR not found');
    if (okr.status !== 'ACCEPTED') {
      throw new BadRequestException('OKR chưa được chấp nhận, không thể lưu nháp.');
    }

    okr.selfReportData = selfReportData;
    okr.totalScore = this.calculateOkrScore(okr.keyResults, selfReportData);

    await this.userOkrRepo.save(okr);
    return okr;
  }

  // --- DEAN REVIEW: Dean reviews self-reports ---

  /**
   * Fetches OKR self-reports filtered by status.
   * Non-admin roles are restricted to their own department.
   * 
   * @param status Targets status (defaults to 'SUBMITTED')
   * @param requesterId The user fetching submitted reports
   * @returns Array of matching UserOkr records
   */
  async getSubmittedOkrs(status: string = 'SUBMITTED', requesterId?: string) {
    // Auto-submit expired reviews if cycle is closed or past its end date
    await this.checkAndAutoSubmitAllExpiredReports();

    const restrictDeptId = await this.getRestrictDeptId(requesterId);

    const okrs = await this.userOkrRepo.find({
      where: { status },
      relations: ['user', 'user.department', 'user.managementPosition', 'cycle'],
      order: { updatedAt: 'DESC' },
    });

    if (restrictDeptId) {
      return okrs.filter(o => o.user?.department?.id === restrictDeptId);
    }
    return okrs;
  }

  /**
   * Performs manager evaluation on user self-report.
   * Computes manager's score, sets status to COMPLETED, and syncs points to the user's Evaluation sheet.
   * 
   * @param id UserOkr ID
   * @param managerReportData Manager validated quantifications
   * @returns Saved UserOkr record
   * @throws {NotFoundException} If the OKR is not found
   */
  async managerReviewOkr(id: string, managerReportData: any) {
    const okr = await this.userOkrRepo.findOne({ where: { id } });
    if (!okr) throw new NotFoundException('OKR not found');

    okr.managerReportData = managerReportData;
    okr.managerScore = this.calculateOkrScore(okr.keyResults, managerReportData);
    okr.status = 'COMPLETED';

    await this.userOkrRepo.save(okr);

    // 🔄 Auto-sync: Clone scores from OKR to Evaluation Form
    await this.syncEvaluationFromOkr(okr);

    await this.notificationService.create(
      okr.userId,
      `📊 OKR "${okr.objective}" đã được Trưởng khoa xem xét và duyệt: ${okr.managerScore} điểm. Phiếu Đánh Giá đã được cập nhật.`,
    );
    return okr;
  }

  // ==========================================
  // --- EVALUATION FORM: EVALUATION SHEET ---
  // ==========================================

  /**
   * Prioritizes finding the most applicable UserOkr record in a cycle for evaluation building.
   * Preference hierarchy: COMPLETED (manager rated) > SUBMITTED (self-reported) > ACCEPTED > PENDING
   * 
   * @param userId Target user ID
   * @param cycleId Evaluation cycle ID
   * @returns Best matching UserOkr record, or null
   */
  private async findBestUserOkr(userId: string, cycleId?: string): Promise<UserOkr | null> {
    const whereClause: any = { userId };
    if (cycleId) {
      whereClause.cycleId = cycleId;
    }

    // Prioritize finding COMPLETED OKR (manager finalized score)
    const completed = await this.userOkrRepo.findOne({
      where: { ...whereClause, status: 'COMPLETED' },
      order: { updatedAt: 'DESC' },
    });
    if (completed) return completed;

    // Fallback: SUBMITTED OKR (user self-reported)
    const submitted = await this.userOkrRepo.findOne({
      where: { ...whereClause, status: 'SUBMITTED' },
      order: { updatedAt: 'DESC' },
    });
    if (submitted) return submitted;

    // Final fallback: any OKR
    return this.userOkrRepo.findOne({
      where: whereClause,
      order: { updatedAt: 'DESC' },
    });
  }

  /**
   * Formats objective-level scores (self vs manager) from a UserOkr structure.
   * 
   * @param okr Source UserOkr entity
   * @returns Formatted evaluation list and score summaries
   */
  private buildEvaluationDataFromOkr(okr: UserOkr) {
    const evaluationData: any[] = [];
    let selfScoreTotal = 0;
    let principalScoreTotal = 0;

    if (okr && okr.keyResults && Array.isArray(okr.keyResults)) {
      for (const obj of okr.keyResults) {
        const selfScore = this.calcSingleObjectiveScore(obj, okr.selfReportData || {});
        // If manager has approved OKR (COMPLETED), take manager score, otherwise set to 0
        const mgrScore = okr.managerReportData
          ? this.calcSingleObjectiveScore(obj, okr.managerReportData)
          : 0;

        evaluationData.push({
          id: obj.id,
          name: obj.title,
          maxScore: obj.maxScore,
          selfScore: selfScore,
          principalScore: mgrScore,
        });

        selfScoreTotal += selfScore;
        principalScoreTotal += mgrScore;
      }
    }

    return { evaluationData, selfScoreTotal, principalScoreTotal };
  }

  /**
   * Retrieves or creates the UserEvaluation form sheet for a specific user and cycle.
   * Clones and updates structural objective scores from the user's best available OKR.
   * 
   * @param userId Target user ID
   * @param cycleId Targeted cycle ID
   * @returns UserEvaluation entity decorated with OKR details
   * @throws {NotFoundException} If form is not resolvable
   */
  async getMyEvaluationForm(userId: string, cycleId?: string) {
    // Auto-submit expired reviews if cycle is closed or past its end date
    await this.checkAndAutoSubmitAllExpiredReports();

    let targetCycleId = cycleId;

    if (!targetCycleId) {
      const openCycle = await this.userEvaluationRepo.manager.getRepository(EvaluationCycle).findOne({
        where: { status: EvaluationStatus.OPEN, isDel: false },
        order: { createdAt: 'DESC' },
      });
      if (openCycle) {
        targetCycleId = openCycle.id;
      } else {
        const lastCycle = await this.userEvaluationRepo.manager.getRepository(EvaluationCycle).findOne({
          where: { isDel: false },
          order: { createdAt: 'DESC' },
        });
        if (lastCycle) {
          targetCycleId = lastCycle.id;
        }
      }
    }

    const whereClause: any = { userId };
    if (targetCycleId) {
      whereClause.cycleId = targetCycleId;
    }

    let form = await this.userEvaluationRepo.findOne({
      where: whereClause,
      relations: ['user', 'user.department', 'user.managementPosition', 'cycle'],
    });

    // Find the most appropriate UserOkr
    const okr = await this.findBestUserOkr(userId, targetCycleId);

    if (!okr) {
      if (form) {
        return {
          ...form,
          okrObjectiveName: '',
          okrStatus: null,
        };
      }
      return null;
    }

    // Build evaluationData from OKR Template assigned to user
    const { evaluationData, selfScoreTotal, principalScoreTotal } = this.buildEvaluationDataFromOkr(okr);

    // Save OKR/Template name for FE display
    const okrObjectiveName = okr?.objective || '';

    if (!form) {
      form = this.userEvaluationRepo.create({
        userId,
        status: 'PENDING_EVALUATION',
        evaluationData,
        selfScoreTotal,
        principalScoreTotal,
        cycleId: targetCycleId || okr?.cycleId || undefined,
      });
      await this.userEvaluationRepo.save(form);

      // Reload with relations
      form = await this.userEvaluationRepo.findOne({
        where: { id: form.id },
        relations: ['user', 'user.department', 'user.managementPosition', 'cycle'],
      });
    } else {
      // Only update evaluationData from OKR if form is not in finalized EVALUATED status
      if (form.status !== 'EVALUATED') {
        form.evaluationData = evaluationData;
        form.selfScoreTotal = selfScoreTotal;
        form.principalScoreTotal = principalScoreTotal;
      }
      if (targetCycleId && !form.cycleId) {
        form.cycleId = targetCycleId;
      }
      await this.userEvaluationRepo.save(form);
    }

    // Attach additional details for FE rendering
    return {
      ...form,
      okrObjectiveName,
      okrStatus: okr?.status || null,
    };
  }

  /**
   * User submits their self-evaluation sheet details (selfComment, selfRating).
   * Sets status to SUBMITTED and notifies managers/admins.
   * 
   * @param userId Submitting user ID
   * @param body Payload containing selfComment, selfRating, cycleId
   * @returns Saved UserEvaluation entity
   * @throws {NotFoundException} If the evaluation form cannot be loaded
   */
  async submitMyEvaluationForm(userId: string, body: any) {
    const form = await this.getMyEvaluationForm(userId, body.cycleId);
    if (!form) throw new NotFoundException('Evaluation Form not found');

    // Update self-comment section
    const entity = await this.userEvaluationRepo.findOne({ 
      where: { id: form.id },
      relations: ['user', 'user.department', 'cycle']
    });
    if (!entity) throw new NotFoundException('Evaluation Form not found');

    entity.selfComment = body.selfComment;
    entity.selfRating = body.selfRating;
    entity.status = 'SUBMITTED';

    const saved = await this.userEvaluationRepo.save(entity);

    // Send notification to managers/admins when self-evaluation is submitted
    try {
      const managers = await this.userEvaluationRepo.manager.getRepository(User).find({
        relations: ['roles', 'managementPosition'],
      });

      const targetManagers = managers.filter(u => 
        u.roles.some(r => r.slug === 'ADMIN') || 
        (u.managementPosition && (
          u.managementPosition.permissionLevel !== 'NONE' ||
          ['TRUONG_KHOA', 'PHO_TRUONG_KHOA', 'TRUONG_BO_MON', 'PHO_TRUONG_BO_MON'].includes(u.managementPosition.slug)
        ))
      );

      const senderName = entity.user?.name || entity.user?.email || 'Nhân sự';
      const deptName = entity.user?.department?.name ? ` thuộc bộ môn ${entity.user.department.name}` : '';
      const cycleName = entity.cycle?.name ? ` cho ${entity.cycle.name}` : '';
      const message = `🔔 ${senderName}${deptName} đã nộp phiếu tự đánh giá${cycleName} (${entity.selfRating}).`;

      for (const manager of targetManagers) {
        if (manager.id !== userId) {
          await this.notificationService.create(manager.id, message);
        }
      }
    } catch (err) {
      console.error('Lỗi gửi thông báo cho quản lý khi nộp phiếu tự đánh giá:', err);
    }

    return saved;
  }

  /**
   * Retrieves evaluation sheets submitted by users.
   * Scopes results to department if restricted.
   * 
   * @param requesterId Requester user ID
   * @returns Array of UserEvaluation records
   */
  async getSubmittedEvaluations(requesterId?: string) {
    // Auto-submit expired reviews if cycle is closed or past its end date
    await this.checkAndAutoSubmitAllExpiredReports();

    const restrictDeptId = await this.getRestrictDeptId(requesterId);

    const evaluations = await this.userEvaluationRepo.find({
      relations: ['user', 'user.department', 'user.managementPosition', 'cycle'],
      order: { updatedAt: 'DESC' },
    });

    if (restrictDeptId) {
      return evaluations.filter(e => e.user?.department?.id === restrictDeptId);
    }
    return evaluations;
  }

  /**
   * Manager reviews and grades a user's final quality evaluation form.
   * Sets final rating and comments, changing status to EVALUATED.
   * 
   * @param id UserEvaluation ID
   * @param body Payload containing managerComment and managerRating
   * @returns Saved UserEvaluation record
   * @throws {NotFoundException} If evaluation is not found
   */
  async managerReviewEvaluation(id: string, body: any) {
    const form = await this.userEvaluationRepo.findOne({ where: { id } });
    if (!form) throw new NotFoundException('Evaluation form not found');

    form.managerComment = body.managerComment;
    form.managerRating = body.managerRating;
    form.status = 'EVALUATED';

    await this.userEvaluationRepo.save(form);
    return form;
  }

  /**
   * Auto-sync: Clones and updates objective-level scores to UserEvaluation
   * when a manager completes review on user's OKR.
   * 
   * @param okr Completed UserOkr entity
   */
  private async syncEvaluationFromOkr(okr: UserOkr) {
    const { evaluationData, selfScoreTotal, principalScoreTotal } =
      this.buildEvaluationDataFromOkr(okr);

    let form = await this.userEvaluationRepo.findOne({
      where: { userId: okr.userId, cycleId: okr.cycleId },
    });

    if (!form) {
      form = this.userEvaluationRepo.create({
        userId: okr.userId,
        status: 'PENDING_EVALUATION',
        evaluationData,
        selfScoreTotal,
        principalScoreTotal,
        cycleId: okr.cycleId,
      });
    } else {
      // Only update if form is not EVALUATED yet (manager has not finalized rating)
      if (form.status !== 'EVALUATED') {
        form.evaluationData = evaluationData;
        form.selfScoreTotal = selfScoreTotal;
        form.principalScoreTotal = principalScoreTotal;
      }
    }

    await this.userEvaluationRepo.save(form);
  }

  // ==========================================
  // --- DEAN DASHBOARD: AGGREGATE API ---
  // ==========================================

  /**
   * Compiles comprehensive statistics and reports for the Dean / Department Head dashboard.
   * Calculates cycle progress, summary metrics, OKR status distributions, department-wise stats,
   * individual user ranking lists, final grading distributions, and action items list.
   * 
   * @param requesterId Requesting user ID for RBAC restriction
   * @param cycleId Evaluation cycle filter ID (defaults to active OPEN cycle)
   * @returns Dashboard statistics object
   */
  async getDeanDashboard(requesterId?: string, cycleId?: string) {
    // Auto-submit expired reviews if cycle is closed or past its end date
    await this.checkAndAutoSubmitAllExpiredReports();

    const restrictDeptId = await this.getRestrictDeptId(requesterId);

    // 1. Find OPEN evaluation cycle (or latest cycle)
    const cycles = await this.userEvaluationRepo.manager
      .getRepository(EvaluationCycle)
      .find({ where: { isDel: false }, order: { createdAt: 'DESC' } });

    // Determine current cycle being viewed
    let currentCycle: EvaluationCycle | null = null;
    if (cycleId) {
      currentCycle = cycles.find(c => c.id === cycleId) || null;
    } else {
      // Default: OPEN cycle, otherwise fallback to latest cycle
      const openCycle = cycles.find(c => c.status === EvaluationStatus.OPEN);
      currentCycle = openCycle || cycles[0] || null;
    }

    // Verify if it is a future cycle (startDate > now)
    const now = new Date();
    const isFutureCycle = currentCycle?.startDate
      ? new Date(currentCycle.startDate) > now
      : false;

    // Calculate cycle progress percentage
    let cycleProgressPercent = 0;
    if (!isFutureCycle && currentCycle?.startDate && currentCycle?.endDate) {
      const start = new Date(currentCycle.startDate).getTime();
      const end = new Date(currentCycle.endDate).getTime();
      if (end > start) {
        cycleProgressPercent = Math.max(0, Math.min(100, ((now.getTime() - start) / (end - start)) * 100));
      }
    }

    // Calculate remaining days
    let daysRemaining: number | null = null;
    if (currentCycle?.endDate) {
      const diff = new Date(currentCycle.endDate).getTime() - now.getTime();
      daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    // 2. Retrieve OKRs for current cycle (with user, department)
    const okrWhere: any = {};
    if (currentCycle) {
      okrWhere.cycleId = currentCycle.id;
    }
    let allOkrs = await this.userOkrRepo.find({
      where: okrWhere,
      relations: ['user', 'user.department', 'user.managementPosition', 'cycle'],
      order: { updatedAt: 'DESC' },
    });

    // 3. Retrieve evaluations for current cycle
    const evalWhere: any = {};
    if (currentCycle) {
      evalWhere.cycleId = currentCycle.id;
    }
    let allEvaluations = await this.userEvaluationRepo.find({
      where: evalWhere,
      relations: ['user', 'user.department', 'user.managementPosition', 'cycle'],
      order: { updatedAt: 'DESC' },
    });

    // 4. Retrieve all departments
    let departments = await this.userEvaluationRepo.manager
      .getRepository('Department')
      .find({ relations: ['users'], order: { name: 'ASC' } }) as any[];

    if (restrictDeptId) {
      allOkrs = allOkrs.filter(o => o.user?.department?.id === restrictDeptId);
      allEvaluations = allEvaluations.filter(e => e.user?.department?.id === restrictDeptId);
      departments = departments.filter(d => d.id === restrictDeptId);
    }

    // 5. Aggregate SUMMARY
    const statusCounts: Record<string, number> = {
      PENDING: 0, NEGOTIATING: 0, ACCEPTED: 0, SUBMITTED: 0, COMPLETED: 0, REJECTED: 0,
    };
    for (const okr of allOkrs) {
      if (statusCounts[okr.status] !== undefined) {
        statusCounts[okr.status]++;
      }
    }

    const totalStaff = departments.reduce((sum: number, d: any) => sum + (d.users ? d.users.length : 0), 0);

    const summary = {
      totalStaff,
      totalOkrs: allOkrs.length,
      pendingApproval: statusCounts.PENDING + statusCounts.NEGOTIATING,
      awaitingReview: statusCounts.SUBMITTED,
      completed: statusCounts.COMPLETED,
      accepted: statusCounts.ACCEPTED,
      notStarted: totalStaff - allOkrs.length,
    };

    // 6. OKRs by status
    const okrsByStatus = statusCounts;

    // 7. Statistics by department
    const deptMap: Record<string, {
      deptId: string; deptName: string; deptCode: string; memberCount: number;
      completedCount: number; submittedCount: number; acceptedCount: number; pendingCount: number;
      totalScore: number; scoreCount: number;
    }> = {};

    for (const dept of departments) {
      deptMap[dept.id] = {
        deptId: dept.id,
        deptName: dept.name,
        deptCode: dept.code,
        memberCount: dept.users ? dept.users.length : 0,
        completedCount: 0,
        submittedCount: 0,
        acceptedCount: 0,
        pendingCount: 0,
        totalScore: 0,
        scoreCount: 0,
      };
    }

    for (const okr of allOkrs) {
      const deptId = okr.user?.department?.id;
      if (!deptId || !deptMap[deptId]) continue;

      if (okr.status === 'COMPLETED') {
        deptMap[deptId].completedCount++;
        if (okr.managerScore !== null && okr.managerScore !== undefined) {
          deptMap[deptId].totalScore += okr.managerScore;
          deptMap[deptId].scoreCount++;
        }
      } else if (okr.status === 'SUBMITTED') {
        deptMap[deptId].submittedCount++;
      } else if (okr.status === 'ACCEPTED') {
        deptMap[deptId].acceptedCount++;
      } else if (okr.status === 'PENDING' || okr.status === 'NEGOTIATING') {
        deptMap[deptId].pendingCount++;
      }
    }

    const departmentStats = Object.values(deptMap).map(d => ({
      ...d,
      avgScore: d.scoreCount > 0 ? Math.round((d.totalScore / d.scoreCount) * 10) / 10 : null,
      completionRate: d.memberCount > 0 ? Math.round((d.completedCount / d.memberCount) * 100) : 0,
    }));

    // 8. Individual ranking board (only SUBMITTED or COMPLETED, max 50)
    const rankableOkrs = allOkrs
      .filter(o => o.status === 'SUBMITTED' || o.status === 'COMPLETED')
      .sort((a, b) => {
        if (a.managerScore !== null && b.managerScore === null) return -1;
        if (a.managerScore === null && b.managerScore !== null) return 1;
        if (a.managerScore !== null && b.managerScore !== null) return b.managerScore - a.managerScore;
        return (b.totalScore || 0) - (a.totalScore || 0);
      })
      .slice(0, 50);

    const staffRanking = rankableOkrs.map(okr => ({
      okrId: okr.id,
      userId: okr.userId,
      userName: okr.user?.name || 'N/A',
      userAvatar: okr.user?.avatarUrl || null,
      deptName: okr.user?.department?.name || 'N/A',
      deptCode: okr.user?.department?.code || '',
      jobTitle: (okr.user as any)?.jobTitle || null,
      objective: okr.objective,
      totalScore: okr.totalScore || 0,
      managerScore: okr.managerScore ?? null,
      status: okr.status,
    }));

    // 9. Rating distribution + detail lists per rating
    const ratingDistribution: Record<string, number> = {};
    const ratingDetails: Record<string, Array<{
      userId: string;
      userName: string;
      userAvatar: string | null;
      deptName: string;
      selfScore: number | null;
      managerScore: number | null;
    }>> = {};

    for (const ev of allEvaluations) {
      if (ev.managerRating) {
        const rating = ev.managerRating;
        ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1;
        if (!ratingDetails[rating]) ratingDetails[rating] = [];
        ratingDetails[rating].push({
          userId: ev.userId,
          userName: ev.user?.name || 'N/A',
          userAvatar: (ev.user as any)?.avatarUrl || null,
          deptName: ev.user?.department?.name || 'N/A',
          selfScore: ev.selfScoreTotal ?? null,
          managerScore: ev.principalScoreTotal ?? null,
        });
      }
    }

    // 11. Action items (only applicable for OPEN cycle)
    const actionItems: Array<{ type: string; count: number; label: string; route: string; severity: string }> = [];

    if (!isFutureCycle) {
      if (summary.pendingApproval > 0) {
        actionItems.push({
          type: 'PENDING_APPROVAL',
          count: summary.pendingApproval,
          label: `${summary.pendingApproval} OKR đang chờ duyệt`,
          route: '/departments/okr?tab=2',
          severity: 'error',
        });
      }
      if (summary.awaitingReview > 0) {
        actionItems.push({
          type: 'AWAITING_REVIEW',
          count: summary.awaitingReview,
          label: `${summary.awaitingReview} bài tự khai chờ chấm điểm`,
          route: '/departments/okr?tab=3',
          severity: 'warning',
        });
      }
      const pendingEvalCount = allEvaluations.filter(e => e.status === 'SUBMITTED').length;
      if (pendingEvalCount > 0) {
        actionItems.push({
          type: 'PENDING_EVALUATION',
          count: pendingEvalCount,
          label: `${pendingEvalCount} phiếu đánh giá chờ xếp loại`,
          route: '/departments/okr?tab=4',
          severity: 'warning',
        });
      }
      if (cycleProgressPercent > 50) {
        const lateCount = allOkrs.filter(o => o.status === 'ACCEPTED').length;
        if (lateCount > 0) {
          actionItems.push({
            type: 'LATE_SUBMISSION',
            count: lateCount,
            label: `${lateCount} người chưa nộp tự khai (đã qua ${Math.round(cycleProgressPercent)}% kỳ)`,
            route: '/departments/okr?tab=3',
            severity: 'info',
          });
        }
      }
    }

    return {
      cycle: currentCycle ? {
        id: currentCycle.id,
        name: currentCycle.name,
        status: currentCycle.status,
        startDate: currentCycle.startDate,
        endDate: currentCycle.endDate,
        progressPercent: Math.round(cycleProgressPercent),
        daysRemaining,
        isFuture: isFutureCycle,
      } : null,
      allCycles: cycles.map(c => ({
        id: c.id,
        name: c.name,
        status: c.status,
        startDate: c.startDate,
        endDate: c.endDate,
      })),
      summary,
      okrsByStatus,
      departmentStats,
      staffRanking,
      ratingDistribution,
      ratingDetails,
      actionItems,
    };
  }
}