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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Load file .env
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [User, Role, Department, AllowedDomain],
      synchronize: true, // LƯU Ý: Dev để true để nó tự tạo bảng, lên Prod phải tắt!
    }),
    AuthModule,
    AdminModule,
    UsersModule,
    DepartmentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
