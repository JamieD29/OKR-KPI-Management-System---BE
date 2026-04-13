import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OkrController } from './okr.controller';
import { OkrService } from './okr.service';
import { Objective } from '../../database/entities/objective.entity';
import { KeyResult } from '../../database/entities/key-result.entity';
import { UserOkr } from '../../database/entities/performance/user-okr.entity';
import { UserEvaluation } from '../../database/entities/performance/user-evaluation.entity';
import { NotificationModule } from '../notification/notification.module';

@Module({
  // Phải đăng ký 2 cái Entity này thì Service mới dùng được Repo
  imports: [TypeOrmModule.forFeature([Objective, KeyResult, UserOkr, UserEvaluation]), NotificationModule],
  controllers: [OkrController],
  providers: [OkrService],
})
export class OkrModule {}
