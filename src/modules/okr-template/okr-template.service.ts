import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
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
  ) { }

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

  async findByCreator(userId: string) {
    return this.okrTemplateRepository.find({
      where: { createdByUserId: userId },
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

  private async generateUniqueTitle(title: string, excludeId?: string): Promise<string> {
    const query = this.okrTemplateRepository.createQueryBuilder('template')
      .select('template.title', 'title');
    if (excludeId) {
      query.where('template.id != :excludeId', { excludeId });
    }
    const templates = await query.getRawMany();
    const existingTitles = templates.map(t => t.title.toLowerCase());

    const titleLower = title.toLowerCase();
    if (!existingTitles.includes(titleLower)) {
      return title;
    }

    let baseTitle = title;
    let startCounter = 1;
    const match = title.match(/^(.*)\((\d+)\)$/);
    if (match) {
      baseTitle = match[1];
      startCounter = parseInt(match[2], 10) + 1;
    }

    let counter = startCounter;
    let newTitle = `${baseTitle}(${counter})`;
    while (existingTitles.includes(newTitle.toLowerCase())) {
      counter++;
      newTitle = `${baseTitle}(${counter})`;
    }
    return newTitle;
  }

  async create(createDto: any, userId?: string) {
    this.validateTemplateStructure(createDto.structure);

    if (createDto.title) {
      createDto.title = await this.generateUniqueTitle(createDto.title);
    }
    
    console.log('[DEBUG OkrTemplateService.create] Received userId:', userId);
    if (userId) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      console.log('[DEBUG OkrTemplateService.create] Found User in DB:', user);
      if (user) {
        createDto.createdByUserId = user.id;
        createDto.createdByName = user.name || user.email;
        if (!createDto.departmentId && user.department?.id) {
          createDto.departmentId = user.department.id;
        }
      }
    }

    const template = this.okrTemplateRepository.create(createDto);
    const saved = await this.okrTemplateRepository.save(template);
    console.log('[DEBUG OkrTemplateService.create] Saved Template:', saved);
    return saved;
  }

  async update(id: string, updateDto: any, userId?: string, isAdmin?: boolean) {
    if (updateDto.structure) {
      this.validateTemplateStructure(updateDto.structure);
    }
    const template = await this.findOne(id);
    if (!isAdmin && userId && template.createdByUserId !== userId) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa template này.');
    }

    if (updateDto.title && updateDto.title !== template.title) {
      updateDto.title = await this.generateUniqueTitle(updateDto.title, id);
    }

    const updated = Object.assign(template, updateDto);
    return this.okrTemplateRepository.save(updated);
  }

  async remove(id: string, userId?: string, isAdmin?: boolean) {
    const template = await this.findOne(id);
    if (!isAdmin && userId && template.createdByUserId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa template này.');
    }
    await this.okrTemplateRepository.remove(template);
    return { success: true };
  }

  async applyTemplate(
    templateId: string,
    applyDto: { userIds: string[]; cycleId: string; deadline?: Date },
    requesterId?: string,
  ) {
    const template = await this.findOne(templateId);
    if (!template.structure || template.structure.length === 0) {
      throw new BadRequestException('Template structure is empty');
    }

    if (!applyDto.userIds || applyDto.userIds.length === 0) {
      throw new BadRequestException('Phải chọn ít nhất 1 người để giao OKR');
    }

    // 1. Kiểm tra giới hạn phòng ban của người yêu cầu
    let restrictDeptId: string | null = null;
    if (requesterId) {
      const requester = await this.userRepository.findOne({
        where: { id: requesterId },
        relations: ['managementPosition', 'department', 'roles'],
      });
      if (requester) {
        const isAdmin = requester.roles?.some(r => r.slug === 'ADMIN');
        if (!isAdmin && requester.managementPosition?.permissionLevel === 'DON_VI') {
          restrictDeptId = requester.department?.id || null;
        }
      }
    }

    const results: any[] = [];

    for (const userId of applyDto.userIds) {
      const user = await this.userRepository.findOne({ 
        where: { id: userId },
        relations: ['department']
      });
      if (!user) {
        console.warn(`⚠️ User with ID ${userId} not found, skipping...`);
        continue;
      }

      // 2. Kiểm tra nếu nhân viên được gán nằm ngoài bộ môn quản lý
      if (restrictDeptId && user.department?.id !== restrictDeptId) {
        throw new ForbiddenException(
          `Bạn không có quyền giao OKR cho nhân sự "${user.name || user.email}" vì người này thuộc bộ môn khác.`
        );
      }

      // Kiểm tra xem User đã có OKR trong kỳ đánh giá này chưa
      let userOkr = await this.userOkrRepository.findOne({
        where: { userId: userId, cycleId: applyDto.cycleId }
      });

      if (userOkr) {
        throw new BadRequestException(
          `Nhân sự ${user.name || user.email} đã được giao OKR trong kỳ này. Mỗi nhân sự chỉ được giao tối đa 1 OKR mỗi kỳ.`
        );
      }

      // Tạo mới hoàn toàn
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
