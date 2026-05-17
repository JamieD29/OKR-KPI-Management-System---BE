import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OkrTemplate } from '../../database/entities/performance/okr-template.entity';
import { UserOkr } from '../../database/entities/performance/user-okr.entity';
import { User, JobTitle } from '../../database/entities/user.entity';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class OkrTemplateService {
  constructor(
    @InjectRepository(OkrTemplate)
    private okrTemplateRepository: Repository<OkrTemplate>,
    @InjectRepository(UserOkr)
    private userOkrRepository: Repository<UserOkr>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private notificationService: NotificationService,
  ) {}

  // Trả về danh sách Chức danh nghề nghiệp từ enum JobTitle
  getJobTitles() {
    return Object.entries(JobTitle).map(([key, value]) => ({
      value: value,
      label: value,
      key: key,
    }));
  }

  async findAll() {
    return this.okrTemplateRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findByDepartment(departmentId: string) {
    return this.okrTemplateRepository.find({
      where: { departmentId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const template = await this.okrTemplateRepository.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }
    return template;
  }

  private validateScoresRecursively(items: any[], isObjective: boolean = false): number {
    let totalScore = 0;
    for (const item of items) {
      const maxScore = Number(item.maxScore) || 0;
      if (maxScore < 0) {
        throw new BadRequestException(`Điểm số của "${item.title || item.id}" không được là số âm.`);
      }
      totalScore += maxScore;

      if (item.items && item.items.length > 0) {
        const childrenTotal = this.validateScoresRecursively(item.items);
        if (childrenTotal > maxScore) {
          throw new BadRequestException(`Tổng điểm các mục con (${childrenTotal}) không được vượt quá điểm của mục "${item.title || item.id}" (${maxScore}).`);
        }
      } else if (isObjective) {
        throw new BadRequestException(`Mục tiêu lớn "${item.title || item.id}" phải có ít nhất 1 Kết quả then chốt (KR).`);
      }
    }
    return totalScore;
  }

  private validateTemplateStructure(structure?: any[]) {
    if (!structure || structure.length === 0) {
      throw new BadRequestException('Template phải có ít nhất 1 Mục tiêu (Objective).');
    }
    
    const totalMaxScore = this.validateScoresRecursively(structure, true);
    
    if (totalMaxScore !== 100) {
      throw new BadRequestException(`Tổng điểm (maxScore) của tất cả các Nhiệm vụ (Objective) phải chính xác bằng 100. Hiện tại đang là ${totalMaxScore}.`);
    }
  }

  async create(createDto: any) {
    this.validateTemplateStructure(createDto.structure);
    const template = this.okrTemplateRepository.create(createDto);
    return this.okrTemplateRepository.save(template);
  }

  async update(id: string, updateDto: any) {
    if (updateDto.structure) {
      this.validateTemplateStructure(updateDto.structure);
    }
    const template = await this.findOne(id);
    const updated = Object.assign(template, updateDto);
    return this.okrTemplateRepository.save(updated);
  }

  async remove(id: string) {
    const template = await this.findOne(id);
    await this.okrTemplateRepository.remove(template);
    return { success: true };
  }

  // Chức năng "Áp dụng Template": Tạo UserOkr + Gửi thông báo cho NHIỀU user
  async applyTemplate(
    templateId: string,
    applyDto: { userIds: string[]; cycleId: string; deadline?: Date },
  ) {
    const template = await this.findOne(templateId);
    if (!template.structure || template.structure.length === 0) {
      throw new BadRequestException('Template structure is empty');
    }

    if (!applyDto.userIds || applyDto.userIds.length === 0) {
      throw new BadRequestException('Phải chọn ít nhất 1 người để giao OKR');
    }

    const results: any[] = [];

    for (const userId of applyDto.userIds) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        console.warn(`⚠️ User with ID ${userId} not found, skipping...`);
        continue;
      }

      // Kiểm tra xem User đã có OKR trong kỳ đánh giá này chưa
      let userOkr = await this.userOkrRepository.findOne({
        where: { userId: userId, cycleId: applyDto.cycleId }
      });

      if (userOkr) {
        // Nếu OKR hiện tại đã chốt hoặc đã nộp báo cáo/hoàn thành, không cho phép gán đè
        if (
          userOkr.status === 'ACCEPTED' ||
          userOkr.status === 'SUBMITTED' ||
          userOkr.status === 'COMPLETED'
        ) {
          throw new BadRequestException(
            `Nhân sự ${user.name || user.email} đã chốt hoặc đang nộp báo cáo OKR cho kỳ này. Không thể gán đè template mới.`
          );
        }

        // Nếu đang ở trạng thái PENDING hoặc NEGOTIATING, cập nhật lại cấu trúc template mới
        userOkr.objective = template.title;
        userOkr.keyResults = template.structure;
        userOkr.templateId = templateId;
        userOkr.status = 'PENDING';
        userOkr.deadline = applyDto.deadline ? new Date(applyDto.deadline) : null;
        userOkr.proposedChanges = null; // Reset lại các đề xuất cũ
      } else {
        // Nếu chưa có, tạo mới hoàn toàn
        userOkr = this.userOkrRepository.create({
          user: user,
          userId: userId,
          cycleId: applyDto.cycleId,
          objective: template.title,
          keyResults: template.structure,
          totalScore: 0,
          templateId: templateId,
          status: 'PENDING',
          deadline: applyDto.deadline,
        });
      }

      const saved = await this.userOkrRepository.save(userOkr);
      results.push(saved);

      // 🔔 Gửi thông báo cho user được chỉ định
      const deadlineStr = applyDto.deadline
        ? ` (Deadline: ${new Date(applyDto.deadline).toLocaleDateString('vi-VN')})`
        : '';
      await this.notificationService.create(
        userId,
        `📋 Bạn đã được giao OKR mới: "${template.title}"${deadlineStr}. Vào "OKR Của Tôi" để xem chi tiết và phản hồi.`,
      );
    }

    return { success: true, count: results.length, data: results };
  }
}
