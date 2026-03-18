import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PerformanceController } from './performance.controller';
import { PerformanceService } from './performance.service';

// Chỉ giữ lại EvaluationCycle (KPI đã bị loại bỏ)
import { EvaluationCycle } from '../../database/entities/performance/evaluation-cycle.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([EvaluationCycle]),
  ],
  controllers: [PerformanceController],
  providers: [PerformanceService],
  exports: [PerformanceService],
})
export class PerformanceModule {}
