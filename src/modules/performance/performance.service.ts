import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  EvaluationCycle,
  EvaluationStatus,
  CycleType,
} from '../../database/entities/performance-evaluation/evaluation-cycle.entity';

/**
 * Service handling performance evaluation cycles.
 * Manages the lifecycle of cycles (creation, status toggling, soft deletion),
 * including validation of date bounds.
 */
@Injectable()
export class PerformanceService {
  /**
   * @param cycleRepo Repository for EvaluationCycle entity
   */
  constructor(
    @InjectRepository(EvaluationCycle)
    private cycleRepo: Repository<EvaluationCycle>,
  ) {}

  /**
   * Retrieves all non-deleted evaluation cycles, ordered by creation date descending.
   * 
   * @returns Array of active EvaluationCycle entities
   */
  async getCycles() {
    return this.cycleRepo.find({
      where: { isDel: false },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Creates a new evaluation cycle with validation on start and end dates.
   * 
   * @param name Name of the cycle
   * @param type Type of cycle (e.g. SEMESTER, YEAR, OTHER)
   * @param startDate Starting date of evaluation window
   * @param endDate Ending date of evaluation window
   * @param bypassValidation Flag to bypass past-date restrictions (mainly for testing/demo)
   * @returns The saved EvaluationCycle entity
   * @throws {BadRequestException} If dates are invalid (past start date or endDate <= startDate)
   */
  async createCycle(name: string, type: string, startDate: Date, endDate: Date, bypassValidation?: boolean) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    // Allow validation bypass in all environments (including production for demo/testing)
    const activeBypass = !!bypassValidation;

    // Validation: Prevent creating a cycle with a start date in the past (unless bypassed)
    if (!activeBypass) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (start < today) {
        throw new BadRequestException(
          'Không thể tạo kỳ đánh giá với ngày bắt đầu ở quá khứ. Vui lòng chọn ngày bắt đầu từ hôm nay trở đi.',
        );
      }
    }

    // Validation: endDate must be after startDate
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    if (end <= start) {
      throw new BadRequestException(
        'Ngày kết thúc phải sau ngày bắt đầu.',
      );
    }

    const newCycle = this.cycleRepo.create({
      name,
      type: (type as CycleType) || CycleType.OTHER,
      startDate,
      endDate,
      status: EvaluationStatus.CLOSED,
      bypassValidation: !!bypassValidation,
    });
    return this.cycleRepo.save(newCycle);
  }

  /**
   * Updates the status (OPEN / CLOSED) of a specific evaluation cycle.
   * 
   * @param id EvaluationCycle ID
   * @param status Target status
   * @returns Success response with updated cycle and indicator if cycle window is in the past
   * @throws {NotFoundException} If the cycle is not found
   */
  async toggleCycleStatus(id: string, status: string) {
    const cycle = await this.cycleRepo.findOne({ where: { id, isDel: false } });
    if (!cycle) throw new NotFoundException('Không tìm thấy kỳ đánh giá');

    cycle.status = status as any;
    await this.cycleRepo.save(cycle);

    // Determine if the cycle is past due relative to current date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = cycle.endDate ? new Date(cycle.endDate) : null;
    if (endDate) endDate.setHours(0, 0, 0, 0);

    const isPast = endDate && endDate < today;

    return {
      message: 'Cập nhật thành công',
      cycle,
      isPast, // Frontend will use this flag to display warnings
    };
  }

  /**
   * Soft-deletes a specific evaluation cycle by marking isDel to true.
   * Blocks deletion if the cycle status is currently OPEN.
   * 
   * @param id EvaluationCycle ID
   * @returns Success response message
   * @throws {NotFoundException} If the cycle is not found
   * @throws {BadRequestException} If trying to delete an open cycle
   */
  async deleteCycle(id: string) {
    const cycle = await this.cycleRepo.findOne({ where: { id, isDel: false } });
    if (!cycle) throw new NotFoundException('Không tìm thấy kỳ đánh giá');

    if (cycle.status === EvaluationStatus.OPEN) {
      throw new BadRequestException(
        'Không thể xóa kỳ đánh giá đang mở. Vui lòng đóng kỳ trước khi xóa.',
      );
    }

    cycle.isDel = true;
    await this.cycleRepo.save(cycle);
    return { message: 'Xóa kỳ đánh giá thành công' };
  }
}
