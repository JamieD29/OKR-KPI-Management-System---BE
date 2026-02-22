import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PerformanceController } from './performance.controller';
import { PerformanceService } from './performance.service';

// Import các Entity vừa tạo
import { EvaluationCycle } from '../../database/entities/performance/evaluation-cycle.entity';
import { KpiCategory } from '../../database/entities/performance/kpi-category.entity';
import { KpiTemplate } from '../../database/entities/performance/kpi-template.entity';
import { UserKpi } from '../../database/entities/performance/user-kpi.entity';
import { UserOkr } from '../../database/entities/performance/user-okr.entity';

@Module({
  imports: [
    // Đăng ký Repository cho module này
    TypeOrmModule.forFeature([EvaluationCycle, KpiCategory, KpiTemplate, UserKpi, UserOkr]),
  ],
  controllers: [PerformanceController],
  providers: [PerformanceService],
  exports: [PerformanceService],
})
export class PerformanceModule {}
