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
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class OkrService {
  constructor(
    @InjectRepository(Objective)
    private objectiveRepo: Repository<Objective>,
    @InjectRepository(UserOkr)
    private userOkrRepo: Repository<UserOkr>,
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
}
