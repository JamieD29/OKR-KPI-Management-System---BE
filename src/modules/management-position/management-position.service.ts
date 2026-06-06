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
} from '../../database/entities/performance-evaluation/evaluation-cycle.entity';

/**
 * Service handling management position operations, including position creation,
 * updating, deletion, and checks against active performance evaluation cycles.
 */
@Injectable()
export class ManagementPositionService {
  /**
   * @param positionRepository Repository for ManagementPosition entity
   * @param cycleRepository Repository for EvaluationCycle entity
   */
  constructor(
    @InjectRepository(ManagementPosition)
    private positionRepository: Repository<ManagementPosition>,
    @InjectRepository(EvaluationCycle)
    private cycleRepository: Repository<EvaluationCycle>,
  ) {}

  /**
   * Retrieves all management positions, ordered chronologically by creation date.
   * 
   * @returns Array of ManagementPosition entities
   */
  async findAll() {
    return this.positionRepository.find({
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Creates a new management position.
   * Automatically normalizes the slug to uppercase alphanumeric format.
   * 
   * @param data Details of the position to create
   * @returns The saved ManagementPosition entity
   * @throws {ConflictException} If a position with the same slug already exists
   */
  async create(data: {
    name: string;
    slug: string;
    description?: string;
    permissionLevel?: PermissionLevel;
  }) {
    // Normalize slug to UPPER_CASE format
    const normalizedSlug = data.slug
      .toUpperCase()
      .replace(/\s+/g, '_')
      .replace(/[^A-Z0-9_]/g, '');

    // Validate slug uniqueness
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

  /**
   * Updates an existing management position.
   * If a new slug is supplied, it is normalized and verified to be unique.
   * 
   * @param id The ID of the position to update
   * @param data The partial position details to apply
   * @returns The updated ManagementPosition entity
   * @throws {NotFoundException} If the position is not found
   * @throws {ConflictException} If the updated slug is already in use by another position
   */
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

      // Validate slug uniqueness (excluding current record)
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

  /**
   * Deletes a management position.
   * Prevents deletion if there is currently an active (OPEN) performance evaluation cycle.
   * 
   * @param id The ID of the position to delete
   * @returns A success message
   * @throws {ConflictException} If an evaluation cycle is currently open
   * @throws {NotFoundException} If the position is not found
   */
  async remove(id: string) {
    // Verify if there are any active (OPEN) evaluation cycles
    const activeCycle = await this.cycleRepository.findOne({
      where: { status: EvaluationStatus.OPEN, isDel: false },
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

  /**
   * Retrieves a single management position by its ID.
   * 
   * @param id The ID of the position to retrieve
   * @returns The matching ManagementPosition entity
   * @throws {NotFoundException} If the position is not found
   */
  async findOne(id: string) {
    const position = await this.positionRepository.findOne({ where: { id } });
    if (!position) {
      throw new NotFoundException(`Chức vụ với ID "${id}" không tồn tại`);
    }
    return position;
  }
}
