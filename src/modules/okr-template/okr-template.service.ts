import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OkrTemplate } from '../../database/entities/performance/okr-template.entity';
import { UserOkr } from '../../database/entities/performance/user-okr.entity';
import { User } from '../../database/entities/user.entity';
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

  private validateTemplateStructure(structure?: any[]) {
    if (!structure || structure.length === 0) return;
    
    let totalMaxScore = 0;
    for (const obj of structure) {
      totalMaxScore += Number(obj.maxScore) || 0;
    }
    
    if (totalMaxScore !== 100) {
      throw new BadRequestException(`Tổng điểm (maxScore) của tất cả các Nhiệm vụ phải chính xác bằng 100. Hiện tại đang là ${totalMaxScore}.`);
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

  // Chức năng "Áp dụng Template": Tạo UserOkr + Gửi thông báo cho user
  async applyTemplate(
    templateId: string,
    applyDto: { userId: string; cycleId: string; deadline?: Date },
  ) {
    const template = await this.findOne(templateId);
    if (!template.structure || template.structure.length === 0) {
      throw new BadRequestException('Template structure is empty');
    }

    const user = await this.userRepository.findOne({ where: { id: applyDto.userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${applyDto.userId} not found`);
    }

    // Tạo 1 UserOkr chứa toàn bộ cấu trúc template
    const userOkr = this.userOkrRepository.create({
      user: user,
      userId: applyDto.userId,
      cycleId: applyDto.cycleId,
      objective: template.title,
      keyResults: template.structure,
      totalScore: 0,
      templateId: templateId,
      status: 'PENDING',
      deadline: applyDto.deadline,
    });
    const saved = await this.userOkrRepository.save(userOkr);

    // 🔔 Gửi thông báo cho user được chỉ định
    const deadlineStr = applyDto.deadline
      ? ` (Deadline: ${new Date(applyDto.deadline).toLocaleDateString('vi-VN')})`
      : '';
    await this.notificationService.create(
      applyDto.userId,
      `📋 Bạn đã được giao OKR mới: "${template.title}"${deadlineStr}. Vào "OKR Của Tôi" để xem chi tiết và phản hồi.`,
    );

    return saved;
  }
}
