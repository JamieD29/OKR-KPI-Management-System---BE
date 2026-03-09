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
// 👇 Import các Entity liên quan đến Performance
import { EvaluationCycle } from './database/entities/performance/evaluation-cycle.entity';
import { KpiCategory } from './database/entities/performance/kpi-category.entity';
import { KpiTemplate } from './database/entities/performance/kpi-template.entity';
import { UserKpi } from './database/entities/performance/user-kpi.entity';
import { UserOkr } from './database/entities/performance/user-okr.entity';
import { PerformanceModule } from './modules/performance/performance.module'; // 👈 Import
//import Sytemlog
import { SystemLogsModule } from './modules/system-logs/system-logs.module';
import { OkrModule } from './modules/okr/okr.module'; // 👈 Import nó vào
// 👇 Import Database Seeder để tự động seed data khi khởi động
import { DatabaseSeederService } from './database/database-seeder.service';
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
        KpiCategory,
        KpiTemplate,
        UserKpi,
        UserOkr,
        ManagementPosition,
        Notification,
      ],
      synchronize: true, // LƯU Ý: Dev để true để nó tự tạo bảng, lên Prod phải tắt!
    }),
    // 👇 Đăng ký Entity cho Seeder sử dụng
    TypeOrmModule.forFeature([AllowedDomain, Role]),
    AuthModule,
    AdminModule,
    UsersModule,
    DepartmentsModule,
    PerformanceModule,
    SystemLogsModule,
    OkrModule, // 👈 Đăng ký module Performance
    ManagementPositionModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [AppService, DatabaseSeederService], // 👈 Thêm Seeder vào providers
})
export class AppModule { }
