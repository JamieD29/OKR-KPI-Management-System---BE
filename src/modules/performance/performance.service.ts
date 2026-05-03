import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  EvaluationCycle,
  EvaluationStatus,
  CycleType,
} from '../../database/entities/performance/evaluation-cycle.entity';

@Injectable()
export class PerformanceService {
  constructor(
    @InjectRepository(EvaluationCycle)
    private cycleRepo: Repository<EvaluationCycle>,
  ) {}

  // Lấy danh sách kỳ đánh giá
  async getCycles() {
    return this.cycleRepo.find({ order: { createdAt: 'DESC' } });
  }

  // Tạo kỳ đánh giá mới
  async createCycle(name: string, type: string, startDate: Date, endDate: Date) {
    // Validation: Không cho phép tạo kỳ với ngày bắt đầu ở quá khứ
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    if (start < today) {
      throw new BadRequestException(
        'Không thể tạo kỳ đánh giá với ngày bắt đầu ở quá khứ. Vui lòng chọn ngày bắt đầu từ hôm nay trở đi.',
      );
    }

    // Validation: endDate phải sau startDate
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
    });
    return this.cycleRepo.save(newCycle);
  }

  // Đổi trạng thái kỳ đánh giá (OPEN / CLOSED)
  async toggleCycleStatus(id: string, status: string) {
    const cycle = await this.cycleRepo.findOne({ where: { id } });
    if (!cycle) throw new NotFoundException('Không tìm thấy kỳ đánh giá');

    cycle.status = status as any;
    await this.cycleRepo.save(cycle);

    // Xác định loại kỳ dựa trên thời gian
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = cycle.endDate ? new Date(cycle.endDate) : null;
    if (endDate) endDate.setHours(0, 0, 0, 0);

    const isPast = endDate && endDate < today;

    return {
      message: 'Cập nhật thành công',
      cycle,
      isPast, // Frontend sẽ dùng flag này để hiển thị cảnh báo
    };
  }
}
