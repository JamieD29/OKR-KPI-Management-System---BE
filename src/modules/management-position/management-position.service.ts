import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ManagementPosition,
  PermissionLevel,
} from '../../database/entities/management-position.entity';
import {
  EvaluationCycle,
  EvaluationStatus,
} from '../../database/entities/performance/evaluation-cycle.entity';

@Injectable()
export class ManagementPositionService {
  constructor(
    @InjectRepository(ManagementPosition)
    private positionRepository: Repository<ManagementPosition>,
    @InjectRepository(EvaluationCycle)
    private cycleRepository: Repository<EvaluationCycle>,
  ) {}

  // Lấy tất cả chức vụ quản lý
  async findAll() {
    return this.positionRepository.find({
      order: { createdAt: 'ASC' },
    });
  }

  // Tạo chức vụ mới
  async create(data: {
    name: string;
    slug: string;
    description?: string;
    permissionLevel?: PermissionLevel;
  }) {
    // Chuẩn hóa slug thành UPPER_CASE
    const normalizedSlug = data.slug
      .toUpperCase()
      .replace(/\s+/g, '_')
      .replace(/[^A-Z0-9_]/g, '');

    // Check trùng slug
    const exists = await this.positionRepository.findOne({
      where: { slug: normalizedSlug },
    });
    if (exists) {
      throw new ConflictException(`Chức vụ với slug "${normalizedSlug}" đã tồn tại`);
    }

    const position = this.positionRepository.create({
      name: data.name,
      slug: normalizedSlug,
      description: data.description || undefined,
      permissionLevel: data.permissionLevel || PermissionLevel.NONE,
    });

    return this.positionRepository.save(position);
  }

  // Cập nhật chức vụ
  async update(
    id: string,
    data: { name?: string; slug?: string; description?: string; permissionLevel?: PermissionLevel },
  ) {
    const position = await this.positionRepository.findOne({ where: { id } });
    if (!position) {
      throw new NotFoundException(`Chức vụ với ID "${id}" không tồn tại`);
    }

    if (data.slug) {
      const normalizedSlug = data.slug
        .toUpperCase()
        .replace(/\s+/g, '_')
        .replace(/[^A-Z0-9_]/g, '');

      // Check trùng slug (trừ chính nó)
      const duplicate = await this.positionRepository.findOne({
        where: { slug: normalizedSlug },
      });
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(`Chức vụ với slug "${normalizedSlug}" đã tồn tại`);
      }
      position.slug = normalizedSlug;
    }

    if (data.name !== undefined) position.name = data.name;
    if (data.description !== undefined) position.description = data.description;
    if (data.permissionLevel !== undefined) position.permissionLevel = data.permissionLevel;

    return this.positionRepository.save(position);
  }

  // Xóa chức vụ
  async remove(id: string) {
    // Kiểm tra xem có cycle nào đang OPEN không
    const activeCycle = await this.cycleRepository.findOne({
      where: { status: EvaluationStatus.OPEN },
    });
    if (activeCycle) {
      throw new ConflictException(
        'Không thể xóa chức vụ quản lý trong quá trình đánh giá (có kỳ đánh giá đang mở).',
      );
    }

    const position = await this.positionRepository.findOne({ where: { id } });
    if (!position) {
      throw new NotFoundException(`Chức vụ với ID "${id}" không tồn tại`);
    }
    await this.positionRepository.remove(position);
    return { message: `Đã xóa chức vụ "${position.name}"` };
  }

  // Tìm theo ID
  async findOne(id: string) {
    const position = await this.positionRepository.findOne({ where: { id } });
    if (!position) {
      throw new NotFoundException(`Chức vụ với ID "${id}" không tồn tại`);
    }
    return position;
  }
}
