import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OkrTemplate } from '../../database/entities/performance-evaluation/okr-template.entity';
import { UserOkr } from '../../database/entities/performance-evaluation/user-okr.entity';
import { User, JobTitle } from '../../database/entities/user.entity';
import { NotificationService } from '../notification/notification.service';

/**
 * Service handling OKR Template operations.
 * Includes structural validation of template objectives, unique title generation,
 * CRUD operations on templates, and distributing templates to target users (applying templates).
 */
@Injectable()
export class OkrTemplateService {
  /**
   * @param okrTemplateRepository Repository for OkrTemplate entity
   * @param userOkrRepository Repository for UserOkr entity
   * @param userRepository Repository for User entity
   * @param notificationService Service to record and dispatch notifications
   */
  constructor(
    @InjectRepository(OkrTemplate)
    private okrTemplateRepository: Repository<OkrTemplate>,
    @InjectRepository(UserOkr)
    private userOkrRepository: Repository<UserOkr>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private notificationService: NotificationService,
  ) { }

  /**
   * Map out JobTitle enum key-value pairs for dropdown UI inputs.
   * 
   * @returns Array of job title options
   */
  getJobTitles() {
    return Object.entries(JobTitle).map(([key, value]) => ({
      value: value,
      label: value,
      key: key,
    }));
  }

  /**
   * Retrieves all OKR templates, ordered by creation date descending.
   * 
   * @returns Array of OkrTemplate entities
   */
  async findAll() {
    return this.okrTemplateRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Retrieves OKR templates belonging to a specific department.
   * 
   * @param departmentId Target department ID
   * @returns Array of OkrTemplate entities
   */
  async findByDepartment(departmentId: string) {
    return this.okrTemplateRepository.find({
      where: { departmentId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Retrieves OKR templates created by a specific user.
   * 
   * @param userId Creator user ID
   * @returns Array of OkrTemplate entities
   */
  async findByCreator(userId: string) {
    return this.okrTemplateRepository.find({
      where: { createdByUserId: userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Retrieves a single template by its ID.
   * 
   * @param id Target template ID
   * @returns The matching OkrTemplate entity
   * @throws {NotFoundException} If the template is not found
   */
  async findOne(id: string) {
    const template = await this.okrTemplateRepository.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }
    return template;
  }

  /**
   * Recursively validates structural weights.
   * Guarantees non-negative scores and verifies that sub-item weights do not exceed parent weight bounds.
   * 
   * @param items Array of structural items (objectives, KRs, sub-KRs)
   * @param isObjective Flag indicating if processing high-level Objectives
   * @returns Accumulated score points sum
   * @throws {BadRequestException} If score validation fails or children are empty for an objective
   */
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

  /**
   * Validates that the template structure contains objectives, that sub-weights conform,
   * and that the overall total Objective maxScore sum is exactly 100.
   * 
   * @param structure Structural array of objectives
   * @throws {BadRequestException} If template structure is invalid or total score is not 100
   */
  private validateTemplateStructure(structure?: any[]) {
    if (!structure || structure.length === 0) {
      throw new BadRequestException('Template phải có ít nhất 1 Mục tiêu (Objective).');
    }

    const totalMaxScore = this.validateScoresRecursively(structure, true);

    if (totalMaxScore !== 100) {
      throw new BadRequestException(`Tổng điểm (maxScore) của tất cả các Nhiệm vụ (Objective) phải chính xác bằng 100. Hiện tại đang là ${totalMaxScore}.`);
    }
  }

  /**
   * Generates a unique template title.
   * Append a counter suffix (e.g., "Title(1)") if the title already exists.
   * 
   * @param title Proposed title
   * @param excludeId Template ID to exclude from query (during updates)
   * @returns Confirmed unique title string
   */
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

  /**
   * Creates a new OKR template.
   * Validates structure, assigns unique title, and resolves creator profile metadata.
   * 
   * @param createDto Payload containing template details
   * @param userId Creator user ID
   * @returns The saved OkrTemplate entity
   */
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

  /**
   * Updates an existing OKR template.
   * Validates structure, enforces ownership permissions, and handles title duplication checks.
   * 
   * @param id The ID of the template to update
   * @param updateDto Partial payload updates
   * @param userId Requesting user ID for ownership validation
   * @param isAdmin Flag indicating if requesting user is Admin
   * @returns The updated OkrTemplate entity
   * @throws {ForbiddenException} If a non-admin attempts to edit a template they did not create
   */
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

  /**
   * Deletes an OKR template.
   * Enforces ownership validation before deletion.
   * 
   * @param id The ID of the template to delete
   * @param userId Requesting user ID
   * @param isAdmin Flag indicating if requester is Admin
   * @returns Success response object
   * @throws {ForbiddenException} If a non-admin attempts to delete a template they did not create
   */
  async remove(id: string, userId?: string, isAdmin?: boolean) {
    const template = await this.findOne(id);
    if (!isAdmin && userId && template.createdByUserId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa template này.');
    }
    await this.okrTemplateRepository.remove(template);
    return { success: true };
  }

  /**
   * Applies/assigns an OKR template to a list of target users for a specific cycle.
   * Enforces department-level permissions (non-admins cannot assign templates to users outside their department).
   * Creates a UserOkr record for each user under PENDING status and sends alerts.
   * 
   * @param templateId The ID of the template to distribute
   * @param applyDto Configuration parameters containing target userIds, cycleId, and deadline
   * @param requesterId The user initiating the template application
   * @returns Confirmation metadata and list of created UserOkr entities
   * @throws {BadRequestException} If template is empty, target users are empty, or user is already assigned an OKR in this cycle
   * @throws {ForbiddenException} If requester attempts to assign templates outside their department scope
   */
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

    // 1. Resolve department restriction of the requesting user
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

      // 2. Verify that target user is not outside the manager's department boundary
      if (restrictDeptId && user.department?.id !== restrictDeptId) {
        throw new ForbiddenException(
          `Bạn không có quyền giao OKR cho nhân sự "${user.name || user.email}" vì người này thuộc bộ môn khác.`
        );
      }

      // Validate if target user already has an OKR assigned for this cycle
      let userOkr = await this.userOkrRepository.findOne({
        where: { userId: userId, cycleId: applyDto.cycleId }
      });

      if (userOkr) {
        throw new BadRequestException(
          `Nhân sự ${user.name || user.email} đã được giao OKR trong kỳ này. Mỗi nhân sự chỉ được giao tối đa 1 OKR mỗi kỳ.`
        );
      }

      // Create a new UserOkr record
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

      // 🔔 Dispatch notification to the assigned user
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
