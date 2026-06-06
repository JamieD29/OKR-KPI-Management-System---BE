import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../database/entities/user.entity';
import { Role } from '../../database/entities/role.entity';
import { ManagementPosition } from '../../database/entities/management-position.entity';
import { UserOkr } from '../../database/entities/performance-evaluation/user-okr.entity';
import { UserEvaluation } from '../../database/entities/performance-evaluation/user-evaluation.entity';
import { EvaluationCycle } from '../../database/entities/performance-evaluation/evaluation-cycle.entity';
import { UsersService } from './user.service';
import { UsersController } from './user.controller';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, ManagementPosition, UserOkr, UserEvaluation, EvaluationCycle]),
    NotificationModule, // Import để inject NotificationService
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
