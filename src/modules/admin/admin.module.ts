import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AllowedDomain } from '../../database/entities/allowed-domain.entity';
import { User } from '../../database/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AllowedDomain, User])], // Đăng ký bảng AllowedDomain và User
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
