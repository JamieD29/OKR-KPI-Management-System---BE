import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManagementPosition } from '../../database/entities/management-position.entity';
import { EvaluationCycle } from '../../database/entities/performance/evaluation-cycle.entity';
import { ManagementPositionController } from './management-position.controller';
import { ManagementPositionService } from './management-position.service';

@Module({
  imports: [TypeOrmModule.forFeature([ManagementPosition, EvaluationCycle])],
  controllers: [ManagementPositionController],
  providers: [ManagementPositionService],
  exports: [ManagementPositionService],
})
export class ManagementPositionModule {}
