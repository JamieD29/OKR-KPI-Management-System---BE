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

  async submitSelfReport(id: string, userId: string, selfReportData: any) {
    const okr = await this.userOkrRepo.findOne({ where: { id, userId } });
    if (!okr) throw new NotFoundException('OKR not found');
    if (okr.status !== 'ACCEPTED') {
      throw new BadRequestException('OKR chưa được chấp nhận, không thể tự khai.');
    }

    okr.selfReportData = selfReportData;
    okr.status = 'SUBMITTED'; // Chuyển sang trạng thái "Đã nộp"

    // Tính tổng điểm tự khai
    let total = 0;
    if (selfReportData && typeof selfReportData === 'object') {
      Object.values(selfReportData).forEach((item: any) => {
        total += Number(item.score) || 0;
      });
    }
    okr.totalScore = total;

    await this.userOkrRepo.save(okr);
    return okr;
  }

  // --- DEAN REVIEW: Trưởng khoa duyệt bài tự khai ---

  async getSubmittedOkrs() {
    return this.userOkrRepo.find({
      where: { status: 'SUBMITTED' },
      relations: ['user', 'user.department', 'user.managementPosition'],
      order: { updatedAt: 'DESC' },
    });
  }

  async reviewOkr(id: string, managerData: { finalScore: number; comment?: string }) {
    const okr = await this.userOkrRepo.findOne({ where: { id } });
    if (!okr) throw new NotFoundException('OKR not found');

    okr.totalScore = managerData.finalScore;
    okr.status = 'COMPLETED';

    await this.userOkrRepo.save(okr);
    await this.notificationService.create(
      okr.userId,
      `📊 OKR "${okr.objective}" đã được chấm điểm: ${managerData.finalScore} điểm. ${managerData.comment || ''}`,
    );
    return okr;
  }

  // --- REAL EVALUATION WORKFLOW (Grouped by User) ---

  async syncDummyEvaluations() {
    // Helper/Demo function to generate UserEvaluations for all users who have submitted UserOkrs.
    // In production, this would be triggered when a user officially "Submits everything".
    const users = await this.userOkrRepo.query(`SELECT DISTINCT user_id FROM user_okrs`);
    for (const r of users) {
      let evalRecord = await this.userEvaluationRepo.findOne({ where: { userId: r.user_id } });
      if (!evalRecord) {
        evalRecord = this.userEvaluationRepo.create({
          userId: r.user_id,
          completionPercent: Math.floor(Math.random() * 40) + 60, // Mock 60-100%
          selfScoreTotal: 85,
          status: 'PENDING_EVALUATION',
          evaluationData: [
            { id: "A", name: "Nhiệm vụ Giảng dạy", selfScore: 35, principalScore: 0, maxScore: 40 },
            { id: "B", name: "Nhiệm vụ Nghiên cứu khoa học", selfScore: 18, principalScore: 0, maxScore: 20 },
            { id: "C", name: "Nhiệm vụ chuyên môn nghiệp vụ", selfScore: 15, principalScore: 0, maxScore: 15 },
            { id: "D", name: "Nhiệm vụ lãnh đạo, quản lý...", selfScore: 10, principalScore: 0, maxScore: 15 },
            { id: "E", name: "Các nhiệm vụ khác", selfScore: 7, principalScore: 0, maxScore: 10 },
          ],
        });
        await this.userEvaluationRepo.save(evalRecord);
      }
    }
    return { message: 'Synced User Evaluations' };
  }

  async getSubmittedEvaluations() {
    return this.userEvaluationRepo.find({
      relations: ['user', 'user.department', 'user.managementPosition'],
      order: { updatedAt: 'DESC' },
    });
  }

  async saveEvaluation(evaluationId: string, managerData: { tasks: any[], principalScoreTotal: number }) {
    const evalRecord = await this.userEvaluationRepo.findOne({ where: { id: evaluationId } });
    if (!evalRecord) throw new NotFoundException('Evaluation not found');

    evalRecord.evaluationData = managerData.tasks;
    evalRecord.principalScoreTotal = managerData.principalScoreTotal;
    evalRecord.status = 'EVALUATED';

    await this.userEvaluationRepo.save(evalRecord);
    return evalRecord;
  }

  async bulkSaveEvaluations(updates: { evaluationId: string, tasks: any[], principalScoreTotal: number }[]) {
    for (const update of updates) {
      const evalRecord = await this.userEvaluationRepo.findOne({ where: { id: update.evaluationId } });
      if (evalRecord) {
        evalRecord.evaluationData = update.tasks;
        evalRecord.principalScoreTotal = update.principalScoreTotal;
        evalRecord.status = 'EVALUATED';
        await this.userEvaluationRepo.save(evalRecord);
      }
    }
    return { success: true, count: updates.length };
  }
}
