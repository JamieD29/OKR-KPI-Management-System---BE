import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  EvaluationCycle,
  EvaluationStatus,
} from '../../database/entities/performance/evaluation-cycle.entity';

@Injectable()
export class PerformanceService {
  constructor(
    @InjectRepository(EvaluationCycle)
    private cycleRepo: Repository<EvaluationCycle>,
  ) { }

  // Lấy danh sách kỳ đánh giá
  async getCycles() {
    return this.cycleRepo.find({ order: { createdAt: 'DESC' } });
  }

  // Tạo kỳ đánh giá mới
  async createCycle(name: string, startDate: Date, endDate: Date) {
    const newCycle = this.cycleRepo.create({
      name,
      startDate,
      endDate,
      status: EvaluationStatus.OPEN,
    });
    return this.cycleRepo.save(newCycle);
  }

  // Đổi trạng thái kỳ đánh giá (OPEN / CLOSED)
  async toggleCycleStatus(id: string, status: string) {
    const cycle = await this.cycleRepo.findOne({ where: { id } });
    if (!cycle) throw new NotFoundException('Không tìm thấy kỳ đánh giá');

    cycle.status = status as any;
    await this.cycleRepo.save(cycle);

    return { message: 'Cập nhật thành công', cycle };
  }
}
