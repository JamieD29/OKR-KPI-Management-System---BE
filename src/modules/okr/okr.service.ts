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

  // --- OKR NEGOTIATION + SELF-REPORT WORKFLOW ---

  async getMyOkrs(userId: string) {
    return this.userOkrRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getPendingApproval() {
    return this.userOkrRepo.find({
      where: { status: 'NEGOTIATING' },
      relations: ['user', 'user.department', 'user.managementPosition'],
      order: { createdAt: 'DESC' },
    });
  }

  async acceptOkr(id: string, userId: string) {
    const okr = await this.userOkrRepo.findOne({ where: { id, userId } });
    if (!okr) throw new NotFoundException('OKR not found');
    okr.status = 'ACCEPTED';
    return this.userOkrRepo.save(okr);
  }

  async negotiateOkr(id: string, userId: string, proposedChanges: any) {
    const okr = await this.userOkrRepo.findOne({ where: { id, userId }, relations: ['user'] });
    if (!okr) throw new NotFoundException('OKR not found');

    okr.status = 'NEGOTIATING';
    okr.proposedChanges = proposedChanges;
    await this.userOkrRepo.save(okr);
    return okr;
  }

  async approveOkr(id: string) {
    const okr = await this.userOkrRepo.findOne({ where: { id } });
    if (!okr) throw new NotFoundException('OKR not found');

    okr.status = 'ACCEPTED';
    if (okr.proposedChanges) {
      okr.keyResults = okr.proposedChanges;
      okr.proposedChanges = null;
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
    okr.proposedChanges = null;

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
