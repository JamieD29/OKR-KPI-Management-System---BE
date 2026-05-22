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
import { NotificationService } from '../notification/notification.service';

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
      relations: ['user', 'user.department', 'user.managementPosition'],
      order: { createdAt: 'DESC' },
    });

    // Lazy check: auto-accept expired, rồi lọc chỉ trả về cái còn đang đàm phán
    await this.checkAndAutoAcceptExpired(okrs);
    return okrs.filter(o => o.status === 'NEGOTIATING' || o.status === 'PENDING');
  }

  async acceptOkr(id: string, userId: string) {
    const okr = await this.userOkrRepo.findOne({ where: { id, userId } });
    if (!okr) throw new NotFoundException('OKR not found');
    okr.status = 'ACCEPTED';
    okr.acceptedAt = new Date();
    return this.userOkrRepo.save(okr);
  }

  async sendForApproval(id: string, userId: string) {
    const okr = await this.userOkrRepo.findOne({ where: { id, userId } });
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
    return this.userOkrRepo.save(okr);
  }

  async chatItem(id: string, itemId: string, sender: 'USER' | 'MANAGER', message: string) {
    const okr = await this.userOkrRepo.findOne({ where: { id } });
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

    await this.userOkrRepo.save(okr);
    return okr;
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
    const okr = await this.userOkrRepo.findOne({ where: { id, userId } });
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
    
    await this.userOkrRepo.save(okr);
    return okr;
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

    await this.userOkrRepo.save(okr);
    return okr;
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
    const okr = await this.userOkrRepo.findOne({ where: { id, userId } });
    if (!okr) throw new NotFoundException('OKR not found');
    if (okr.status !== 'ACCEPTED') {
      throw new BadRequestException('OKR chưa được chấp nhận, không thể tự khai.');
    }

    okr.selfReportData = selfReportData;
    okr.status = 'SUBMITTED';

    okr.totalScore = this.calculateOkrScore(okr.keyResults, selfReportData);

    await this.userOkrRepo.save(okr);
    return okr;
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
      relations: ['user', 'user.department', 'user.managementPosition'],
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
  private async findBestUserOkr(userId: string): Promise<UserOkr | null> {
    // Ưu tiên tìm OKR đã COMPLETED (manager đã chốt điểm)
    const completed = await this.userOkrRepo.findOne({
      where: { userId, status: 'COMPLETED' },
      order: { updatedAt: 'DESC' },
    });
    if (completed) return completed;

    // Fallback: OKR đã SUBMITTED (user đã tự khai)
    const submitted = await this.userOkrRepo.findOne({
      where: { userId, status: 'SUBMITTED' },
      order: { updatedAt: 'DESC' },
    });
    if (submitted) return submitted;

    // Fallback cuối: bất kỳ OKR nào
    return this.userOkrRepo.findOne({
      where: { userId },
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

  async getMyEvaluationForm(userId: string) {
    let form = await this.userEvaluationRepo.findOne({
      where: { userId },
      relations: ['user', 'user.department', 'user.managementPosition'],
    });

    // Tìm UserOkr phù hợp nhất (ưu tiên COMPLETED)
    const okr = await this.findBestUserOkr(userId);

    // Build evaluationData từ OKR Template đã giao cho user
    const { evaluationData, selfScoreTotal, principalScoreTotal } = okr
      ? this.buildEvaluationDataFromOkr(okr)
      : { evaluationData: [], selfScoreTotal: 0, principalScoreTotal: 0 };

    // Lưu tên OKR/Template để FE hiển thị
    const okrObjectiveName = okr?.objective || '';

    if (!form) {
      form = this.userEvaluationRepo.create({
        userId,
        status: 'PENDING_EVALUATION',
        evaluationData,
        selfScoreTotal,
        principalScoreTotal,
      });
      await this.userEvaluationRepo.save(form);

      // Reload với relations
      form = await this.userEvaluationRepo.findOne({
        where: { id: form.id },
        relations: ['user', 'user.department', 'user.managementPosition'],
      });
    } else {
      // Luôn cập nhật evaluationData mới nhất từ OKR
      form.evaluationData = evaluationData;
      form.selfScoreTotal = selfScoreTotal;
      form.principalScoreTotal = principalScoreTotal;
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
    const form = await this.getMyEvaluationForm(userId);
    if (!form) throw new NotFoundException('Evaluation Form not found');

    // Cập nhật phần tự nhận xét
    const entity = await this.userEvaluationRepo.findOne({ where: { userId } });
    if (!entity) throw new NotFoundException('Evaluation Form not found');

    entity.selfComment = body.selfComment;
    entity.selfRating = body.selfRating;
    entity.status = 'SUBMITTED';

    await this.userEvaluationRepo.save(entity);
    return entity;
  }

  async getSubmittedEvaluations() {
    return this.userEvaluationRepo.find({
      relations: ['user', 'user.department', 'user.managementPosition'],
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
      where: { userId: okr.userId },
    });

    if (!form) {
      form = this.userEvaluationRepo.create({
        userId: okr.userId,
        status: 'PENDING_EVALUATION',
        evaluationData,
        selfScoreTotal,
        principalScoreTotal,
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

}
