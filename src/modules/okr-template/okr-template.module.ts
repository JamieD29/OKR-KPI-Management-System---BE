import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OkrTemplate } from '../../database/entities/performance/okr-template.entity';
import { OkrTemplateService } from './okr-template.service';
import { OkrTemplateController } from './okr-template.controller';
import { UserOkr } from '../../database/entities/performance/user-okr.entity';
import { User } from '../../database/entities/user.entity';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [TypeOrmModule.forFeature([OkrTemplate, UserOkr, User]), NotificationModule],
  controllers: [OkrTemplateController],
  providers: [OkrTemplateService],
  exports: [OkrTemplateService],
})
export class OkrTemplateModule {}
