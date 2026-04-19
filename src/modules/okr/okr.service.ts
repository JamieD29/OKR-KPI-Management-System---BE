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
    await this.notificationService.create(
      okr.userId,
      `📊 OKR "${okr.objective}" đã được Trưởng khoa xem xét và duyệt: ${okr.managerScore} điểm.`,
    );
    return okr;
  }

  // ==========================================
  // --- EVALUATION FORM: PHIẾU ĐÁNH GIÁ ---
  // ==========================================

  async getMyEvaluationForm(userId: string) {
    let form = await this.userEvaluationRepo.findOne({ 
      where: { userId }, 
      relations: ['user', 'user.department', 'user.managementPosition'] 
    });

    const okr = await this.userOkrRepo.findOne({ where: { userId } });

    // Cập nhật mảng cấu trúc Phần II từ OKR
    const evaluationData: any[] = [];
    let selfScoreTotal = 0;
    let principalScoreTotal = 0;

    if (okr && okr.keyResults && Array.isArray(okr.keyResults)) {
      for (const obj of okr.keyResults) {
        const selfScore = this.calcSingleObjectiveScore(obj, okr.selfReportData || {});
        // Nếu manager đã duyệt OKR thì lấy điểm mgr, nều chưa thì = 0
        const mgrScore = okr.managerReportData ? this.calcSingleObjectiveScore(obj, okr.managerReportData) : 0;
        
        evaluationData.push({
          id: obj.id,
          name: obj.title,
          maxScore: obj.maxScore,
          selfScore: selfScore,
          principalScore: mgrScore
        });
        
        selfScoreTotal += selfScore;
        principalScoreTotal += mgrScore;
      }
    }

    if (!form) {
      form = this.userEvaluationRepo.create({
        userId,
        status: 'PENDING_EVALUATION',
        evaluationData,
        selfScoreTotal,
        principalScoreTotal
      });
      await this.userEvaluationRepo.save(form);
    } else {
      form.evaluationData = evaluationData;
      form.selfScoreTotal = selfScoreTotal;
      form.principalScoreTotal = principalScoreTotal;
      await this.userEvaluationRepo.save(form);
    }

    return form;
  }

  async submitMyEvaluationForm(userId: string, body: any) {
    const form = await this.getMyEvaluationForm(userId);
    if (!form) throw new NotFoundException('Evaluation Form not found');

    form.selfComment = body.selfComment;
    form.selfRating = body.selfRating;
    form.status = 'SUBMITTED';

    await this.userEvaluationRepo.save(form);
    return form;
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

}
