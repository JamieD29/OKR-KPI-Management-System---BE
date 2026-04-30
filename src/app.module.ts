import { App } from 'supertest/types';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { UsersModule } from './modules/users/user.module';
import { User } from './database/entities/user.entity';
import { Role } from './database/entities/role.entity';
import { Department } from './database/entities/department.entity';
import { AllowedDomain } from './database/entities/allowed-domain.entity';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DepartmentsModule } from './modules/departments/departments.module';
// 👇 Import các Entity liên quan đến Performance (KPI đã loại bỏ)
import { EvaluationCycle } from './database/entities/performance/evaluation-cycle.entity';
import { UserOkr } from './database/entities/performance/user-okr.entity';
import { OkrTemplate } from './database/entities/performance/okr-template.entity';
import { PerformanceModule } from './modules/performance/performance.module'; // 👈 Import
//import Sytemlog
import { SystemLogsModule } from './modules/system-logs/system-logs.module';
import { OkrModule } from './modules/okr/okr.module'; // 👈 Import nó vào
import { OkrTemplateModule } from './modules/okr-template/okr-template.module';
// 👇 Import Database Seeder Module
import { DatabaseSeederModule } from './database/database-seeder.module';
// 👇 Import Management Position & Notification
import { ManagementPosition } from './database/entities/management-position.entity';
import { Notification } from './database/entities/notification.entity';
import { ManagementPositionModule } from './modules/management-position/management-position.module';
import { NotificationModule } from './modules/notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Load file .env
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      entities: [
        User,
        Role,
        Department,
        AllowedDomain,
        EvaluationCycle,
        UserOkr,
        OkrTemplate,
        ManagementPosition,
        Notification,
      ],
      synchronize: true, // LƯU Ý: Dev để true để nó tự tạo bảng, lên Prod phải tắt!
    }),
    // 👇 Đăng ký Database Seeder Module
    DatabaseSeederModule,
    AuthModule,
    AdminModule,
    UsersModule,
    DepartmentsModule,
    PerformanceModule,
    SystemLogsModule,
    OkrModule, // 👈 Đăng ký module Performance
    OkrTemplateModule,
    ManagementPositionModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
