import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Objective } from '../../database/entities/objective.entity';
import { UserOkr } from '../../database/entities/performance/user-okr.entity';
import { UserEvaluation } from '../../database/entities/performance/user-evaluation.entity';
import { EvaluationCycle, EvaluationStatus } from '../../database/entities/performance/evaluation-cycle.entity';
import { NotificationService } from '../notification/notification.service';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class OkrService {
  constructor(
    @InjectRepository(Objective)
    private objectiveRepo: Repository<Objective>,
    @InjectRepository(UserOkr)
    private userOkrRepo: Repository<UserOkr>,
    @InjectRepository(UserEvaluation)
    private userEvaluationRepo: Repository<UserEvaluation>,
    private notificationService: NotificationService,
  ) {}

  // Hàm LƯU OKR MỚI (Department objectives - legacy)
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

  async getDepartmentOkrs() {
    return this.objectiveRepo.find({
      where: { type: 'DEPARTMENT' },
      relations: ['keyResults'],
      order: { createdAt: 'DESC' },
    });
  }

  // --- LAZY DEADLINE EVALUATION ---

  /**
   * Kiểm tra deadline và tự động chốt OKR quá hạn.
   * Logic: Nếu deadline < now VÀ status = PENDING|NEGOTIATING
   * → Auto chuyển sang ACCEPTED (lấy phiên bản keyResults mới nhất trong DB)
   * → Gửi notification cho user
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
        // keyResults giữ nguyên phiên bản mới nhất đang có trong DB
        await this.userOkrRepo.save(okr);

        // Gửi thông báo cho user
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

  /** Check nếu OKR đã quá deadline đàm phán */
  private isDeadlineExpired(okr: UserOkr): boolean {
    if (!okr.deadline) return false;
    return new Date(okr.deadline) < new Date();
  }

  // --- OKR NEGOTIATION + SELF-REPORT WORKFLOW ---

  async getMyOkrs(userId: string) {
    const okrs = await this.userOkrRepo.find({
      where: { userId },
      relations: ['cycle'],
      order: { createdAt: 'DESC' },
    });

    // Lazy check: auto-accept nếu quá deadline
    return this.checkAndAutoAcceptExpired(okrs);
  }

  async getPendingApproval() {
    const okrs = await this.userOkrRepo.find({
      where: [
        { status: 'NEGOTIATING' },
        { status: 'PENDING' },
      ],
      relations: ['user', 'user.department', 'user.managementPosition', 'cycle'],
      order: { createdAt: 'DESC' },
    });

    // Lazy check: auto-accept expired, rồi lọc chỉ trả về cái còn đang đàm phán
    await this.checkAndAutoAcceptExpired(okrs);
    return okrs.filter(o => o.status === 'NEGOTIATING' || o.status === 'PENDING');
  }

  async acceptOkr(id: string, userId: string) {
    const okr = await this.userOkrRepo.findOne({ 
      where: { id, userId },
      relations: ['user', 'user.department']
    });
    if (!okr) throw new NotFoundException('OKR not found');
    
    // Đổi trạng thái thành NEGOTIATING để chờ quản lý duyệt chốt OKR
    okr.status = 'NEGOTIATING';
    
    const saved = await this.userOkrRepo.save(okr);

    // Gửi thông báo cho Admin và Trưởng khoa/Phó khoa/Trưởng bộ môn
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

    // Gửi thông báo cho Admin và Trưởng khoa/Phó khoa
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

  async chatItem(id: string, itemId: string, sender: 'USER' | 'MANAGER', message: string) {
    const okr = await this.userOkrRepo.findOne({ 
      where: { id },
      relations: ['user', 'user.department']
    });
    if (!okr) throw new NotFoundException('OKR not found');

    // Chặn đàm phán nếu đã quá deadline (chỉ chặn user, manager vẫn có thể)
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
    
    // Không tự động đổi status khi gửi comment.
    // Status chỉ thay đổi khi user bấm "Gửi thay đổi & Yêu cầu duyệt" hoặc "Gửi yêu cầu duyệt đề xuất".

    const saved = await this.userOkrRepo.save(okr);

    // Nếu manager gửi phản hồi đàm phán (chat comment), gửi thông báo cho user
    if (sender === 'MANAGER') {
      try {
        const messageStr = `💬 Người giao OKR đã phản hồi yêu cầu đề xuất điều chỉnh OKR "${okr.objective}" của bạn.`;
        await this.notificationService.create(okr.userId, messageStr);
      } catch (err) {
        console.error('Lỗi gửi thông báo comment từ manager:', err);
      }
    }

    // Nếu user gửi phản hồi đàm phán (chat comment), gửi thông báo cho manager
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
        // Clone sâu keyResults trước khi sửa
        changes.originalStructure = JSON.parse(JSON.stringify(okr.keyResults));
      }

      updateRecursive(okr.keyResults);
      okr.proposedChanges = changes;
      // Recalculate if necessary, but maxScore is just a structural thing
      // until self-report happens.
    }

    await this.userOkrRepo.save(okr);
    return okr;
  }

  async updateOkrStructure(id: string, userId: string, keyResults: any[], localComments?: Record<string, any[]>) {
    const okr = await this.userOkrRepo.findOne({ 
      where: { id, userId },
      relations: ['user', 'user.department']
    });
    if (!okr) throw new NotFoundException('OKR not found');
    
    if (okr.status !== 'PENDING' && okr.status !== 'NEGOTIATING') {
      throw new BadRequestException('Chỉ có thể thay đổi cấu trúc khi đang đàm phán.');
    }

    // Chặn thay đổi cấu trúc nếu đã quá deadline
    if (this.isDeadlineExpired(okr)) {
      throw new BadRequestException(
        `Đã hết hạn đàm phán (${new Date(okr.deadline!).toLocaleDateString('vi-VN')}). Không thể thay đổi cấu trúc OKR.`,
      );
    }

    // Sao lưu cấu trúc cũ trước khi bị ghi đè, nếu chưa sao lưu
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

    // Gửi thông báo cho Admin và Trưởng khoa/Phó khoa khi gửi đề xuất điều chỉnh OKR
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
    okr.status = 'PENDING'; // Manager đã phản hồi, chờ user xác nhận

    const saved = await this.userOkrRepo.save(okr);

    // Gửi thông báo cho nhân sự là người giao OKR đã phản hồi đề xuất
    try {
      const message = `💬 Người giao OKR đã phản hồi yêu cầu đề xuất điều chỉnh OKR "${okr.objective}" của bạn.`;
      await this.notificationService.create(okr.userId, message);
    } catch (err) {
      console.error('Lỗi gửi thông báo cho user khi manager phản hồi OKR:', err);
    }

    return saved;
  }

  // --- GIA HẠN DEADLINE (Dành cho Trưởng khoa) ---

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

    // Gửi thông báo cho user
    await this.notificationService.create(
      okr.userId,
      `📅 Deadline đàm phán OKR "${okr.objective}" đã được gia hạn: ${oldDeadline} → ${new Date(newDeadline).toLocaleDateString('vi-VN')}.`,
    );

    return okr;
  }

  async approveOkr(id: string) {
    const okr = await this.userOkrRepo.findOne({ where: { id } });
    if (!okr) throw new NotFoundException('OKR not found');

    okr.status = 'ACCEPTED';
    okr.acceptedAt = new Date();
    
    // Xóa bản sao lưu gốc vì đã chấp nhận bản mới
    if (okr.proposedChanges && okr.proposedChanges.originalStructure) {
      delete okr.proposedChanges.originalStructure;
      // KHÔNG gán proposedChanges = null để giữ lại lịch sử comment
    }

    await this.userOkrRepo.save(okr);
    await this.notificationService.create(
      okr.userId,
      `✅ Đề xuất điều chỉnh OKR "${okr.objective}" đã được duyệt!`,
    );
    return okr;
  }

  async rejectOkr(id: string, reason: string) {
    const okr = await this.userOkrRepo.findOne({ where: { id } });
    if (!okr) throw new NotFoundException('OKR not found');

    okr.status = 'PENDING';
    
    // Phục hồi lại bản gốc nếu có sao lưu
    if (okr.proposedChanges && okr.proposedChanges.originalStructure) {
      okr.keyResults = okr.proposedChanges.originalStructure;
      delete okr.proposedChanges.originalStructure;
    }

    // KHÔNG gán proposedChanges = null để giữ lại lịch sử comment làm minh chứng

    await this.userOkrRepo.save(okr);
    await this.notificationService.create(
      okr.userId,
      `❌ Đề xuất OKR "${okr.objective}" bị từ chối: ${reason}`,
    );
    return okr;
  }

  // --- SELF-REPORT: User tự khai điểm ---

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

               // Bổ sung tính điểm cho Sub-Sub-KR (Cấp 4)
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

  // Tách hàm tính điểm từng Objective để dùng cho Phiếu đánh giá
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

             // Bổ sung tính điểm cho Sub-Sub-KR (Cấp 4)
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

    // Gửi thông báo cho các quản lý/admin khi nộp tự khai điểm!
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

  async draftSelfReport(id: string, userId: string, selfReportData: any) {
    const okr = await this.userOkrRepo.findOne({ where: { id, userId } });
    if (!okr) throw new NotFoundException('OKR not found');
    if (okr.status !== 'ACCEPTED') {
      throw new BadRequestException('OKR chưa được chấp nhận, không thể lưu nháp.');
    }

    okr.selfReportData = selfReportData;
    // Calculate score so the UI can show updated points immediately without submitting
    okr.totalScore = this.calculateOkrScore(okr.keyResults, selfReportData);

    await this.userOkrRepo.save(okr);
    return okr;
  }

  // --- DEAN REVIEW: Trưởng khoa duyệt bài tự khai ---

  async getSubmittedOkrs(status: string = 'SUBMITTED') {
    return this.userOkrRepo.find({
      where: { status },
      relations: ['user', 'user.department', 'user.managementPosition', 'cycle'],
      order: { updatedAt: 'DESC' },
    });
  }

  async managerReviewOkr(id: string, managerReportData: any) {
    const okr = await this.userOkrRepo.findOne({ where: { id } });
    if (!okr) throw new NotFoundException('OKR not found');

    okr.managerReportData = managerReportData;
    okr.managerScore = this.calculateOkrScore(okr.keyResults, managerReportData);
    okr.status = 'COMPLETED';

    await this.userOkrRepo.save(okr);

    // 🔄 Auto-sync: Clone điểm từ OKR sang Phiếu Đánh Giá
    await this.syncEvaluationFromOkr(okr);

    await this.notificationService.create(
      okr.userId,
      `📊 OKR "${okr.objective}" đã được Trưởng khoa xem xét và duyệt: ${okr.managerScore} điểm. Phiếu Đánh Giá đã được cập nhật.`,
    );
    return okr;
  }

  // ==========================================
  // --- EVALUATION FORM: PHIẾU ĐÁNH GIÁ ---
  // ==========================================

  /**
   * Tìm UserOkr phù hợp nhất cho user:
   * Ưu tiên: COMPLETED (đã chốt điểm) > SUBMITTED > ACCEPTED > PENDING
   */
  private async findBestUserOkr(userId: string, cycleId?: string): Promise<UserOkr | null> {
    const whereClause: any = { userId };
    if (cycleId) {
      whereClause.cycleId = cycleId;
    }

    // Ưu tiên tìm OKR đã COMPLETED (manager đã chốt điểm)
    const completed = await this.userOkrRepo.findOne({
      where: { ...whereClause, status: 'COMPLETED' },
      order: { updatedAt: 'DESC' },
    });
    if (completed) return completed;

    // Fallback: OKR đã SUBMITTED (user đã tự khai)
    const submitted = await this.userOkrRepo.findOne({
      where: { ...whereClause, status: 'SUBMITTED' },
      order: { updatedAt: 'DESC' },
    });
    if (submitted) return submitted;

    // Fallback cuối: bất kỳ OKR nào
    return this.userOkrRepo.findOne({
      where: whereClause,
      order: { updatedAt: 'DESC' },
    });
  }

  /**
   * Tạo evaluationData từ UserOkr — clone điểm từng Objective (A, B, C, D)
   */
  private buildEvaluationDataFromOkr(okr: UserOkr) {
    const evaluationData: any[] = [];
    let selfScoreTotal = 0;
    let principalScoreTotal = 0;

    if (okr && okr.keyResults && Array.isArray(okr.keyResults)) {
      for (const obj of okr.keyResults) {
        const selfScore = this.calcSingleObjectiveScore(obj, okr.selfReportData || {});
        // Nếu manager đã duyệt OKR (COMPLETED) thì lấy điểm manager, nếu chưa thì = 0
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

  async getMyEvaluationForm(userId: string, cycleId?: string) {
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

    // Tìm UserOkr phù hợp nhất
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

    // Build evaluationData từ OKR Template đã giao cho user
    const { evaluationData, selfScoreTotal, principalScoreTotal } = this.buildEvaluationDataFromOkr(okr);

    // Lưu tên OKR/Template để FE hiển thị
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

      // Reload với relations
      form = await this.userEvaluationRepo.findOne({
        where: { id: form.id },
        relations: ['user', 'user.department', 'user.managementPosition', 'cycle'],
      });
    } else {
      // Chỉ cập nhật evaluationData từ OKR nếu phiếu chưa ở trạng thái chốt EVALUATED
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

    // Attach thêm thông tin để FE hiển thị
    return {
      ...form,
      okrObjectiveName,
      okrStatus: okr?.status || null,
    };
  }

  async submitMyEvaluationForm(userId: string, body: any) {
    const form = await this.getMyEvaluationForm(userId, body.cycleId);
    if (!form) throw new NotFoundException('Evaluation Form not found');

    // Cập nhật phần tự nhận xét
    const whereClause: any = { userId };
    if (body.cycleId) {
      whereClause.cycleId = body.cycleId;
    }
    const entity = await this.userEvaluationRepo.findOne({ 
      where: whereClause,
      relations: ['user', 'user.department', 'cycle']
    });
    if (!entity) throw new NotFoundException('Evaluation Form not found');

    entity.selfComment = body.selfComment;
    entity.selfRating = body.selfRating;
    entity.status = 'SUBMITTED';

    const saved = await this.userEvaluationRepo.save(entity);

    // Gửi thông báo cho các quản lý/admin khi nộp phiếu tự đánh giá!
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

  async getSubmittedEvaluations() {
    return this.userEvaluationRepo.find({
      relations: ['user', 'user.department', 'user.managementPosition', 'cycle'],
      order: { updatedAt: 'DESC' },
    });
  }

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
   * Auto-sync: Khi manager chốt điểm OKR → tự động cập nhật UserEvaluation
   * Đây là trigger chính để clone điểm từ OKR Template sang Phiếu Đánh Giá
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
      // Chỉ cập nhật nếu phiếu chưa bị EVALUATED (manager chưa xếp loại cuối)
      if (form.status !== 'EVALUATED') {
        form.evaluationData = evaluationData;
        form.selfScoreTotal = selfScoreTotal;
        form.principalScoreTotal = principalScoreTotal;
      }
    }

    await this.userEvaluationRepo.save(form);
  }

  // ==========================================
  // --- DEAN DASHBOARD: API TỔNG HỢP ---
  // ==========================================

  async getDeanDashboard(cycleId?: string) {
    // 1. Lấy tất cả kỳ đánh giá (để FE render dropdown)
    const allCyclesList = await this.userEvaluationRepo.manager
      .getRepository(EvaluationCycle)
      .find({ where: { isDel: false }, order: { createdAt: 'DESC' } });

    // Xác định kỳ hiện tại đang xem
    let currentCycle: EvaluationCycle | null = null;
    if (cycleId) {
      currentCycle = allCyclesList.find(c => c.id === cycleId) || null;
    } else {
      // Mặc định: kỳ OPEN, nếu không có thì kỳ mới nhất
      const openCycle = allCyclesList.find(c => c.status === EvaluationStatus.OPEN);
      currentCycle = openCycle || allCyclesList[0] || null;
    }

    // Kiểm tra kỳ tương lai (startDate > now)
    const now = new Date();
    const isFutureCycle = currentCycle?.startDate
      ? new Date(currentCycle.startDate) > now
      : false;

    // Tính tiến độ kỳ
    let cycleProgressPercent = 0;
    if (!isFutureCycle && currentCycle?.startDate && currentCycle?.endDate) {
      const start = new Date(currentCycle.startDate).getTime();
      const end = new Date(currentCycle.endDate).getTime();
      if (end > start) {
        cycleProgressPercent = Math.max(0, Math.min(100, ((now.getTime() - start) / (end - start)) * 100));
      }
    }

    // Tính số ngày còn lại
    let daysRemaining: number | null = null;
    if (currentCycle?.endDate) {
      const diff = new Date(currentCycle.endDate).getTime() - now.getTime();
      daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    // 2. Lấy OKR — lọc theo cycleId nếu có
    const okrWhere: any = currentCycle ? { cycleId: currentCycle.id } : {};
    const allOkrs = isFutureCycle ? [] : await this.userOkrRepo.find({
      where: currentCycle ? { cycleId: currentCycle.id } : undefined,
      relations: ['user', 'user.department', 'user.managementPosition', 'cycle'],
      order: { updatedAt: 'DESC' },
    });

    // 3. Lấy phiếu đánh giá — lọc theo cycleId nếu có
    const allEvaluations = isFutureCycle ? [] : await this.userEvaluationRepo.find({
      where: currentCycle ? { cycleId: currentCycle.id } : undefined,
      relations: ['user', 'user.department', 'user.managementPosition', 'cycle'],
      order: { updatedAt: 'DESC' },
    });

    // 4. Lấy tất cả departments
    const departments = await this.userEvaluationRepo.manager
      .getRepository('Department')
      .find({ relations: ['users'], order: { name: 'ASC' } }) as any[];

    // 5. Tổng hợp SUMMARY
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

    // 6. OKR theo trạng thái
    const okrsByStatus = statusCounts;

    // 7. Thống kê theo bộ môn
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

    // 8. Bảng xếp hạng cá nhân (chỉ SUBMITTED hoặc COMPLETED, max 50)
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

    // 9. Phân bổ xếp loại + chi tiết danh sách người theo từng xếp loại
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

    // 10. Timeline: OKR hoàn thành theo tuần
    const timelineData: Array<{ week: string; weekLabel: string; completed: number; submitted: number }> = [];
    if (!isFutureCycle && currentCycle?.startDate && currentCycle?.endDate) {
      const start = new Date(currentCycle.startDate);
      const end = new Date(currentCycle.endDate);
      const effectiveEnd = now < end ? now : end;

      const weekStart = new Date(start);
      let weekNum = 1;
      while (weekStart <= effectiveEnd) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const completedInWeek = allOkrs.filter(o => {
          if (o.status !== 'COMPLETED' || !o.updatedAt) return false;
          const d = new Date(o.updatedAt);
          return d >= weekStart && d <= weekEnd;
        }).length;

        const submittedInWeek = allOkrs.filter(o => {
          if ((o.status !== 'SUBMITTED' && o.status !== 'COMPLETED') || !o.updatedAt) return false;
          const d = new Date(o.updatedAt);
          return d >= weekStart && d <= weekEnd;
        }).length;

        timelineData.push({
          week: weekStart.toISOString().split('T')[0],
          weekLabel: `Tuần ${weekNum}`,
          completed: completedInWeek,
          submitted: submittedInWeek,
        });

        weekStart.setDate(weekStart.getDate() + 7);
        weekNum++;
      }
    }

    // 11. Action items (chỉ có ý nghĩa với kỳ đang OPEN)
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
      // Danh sách tất cả kỳ để FE render dropdown
      allCycles: allCyclesList.map(c => ({
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
      timelineData,
      actionItems,
    };
  }

}