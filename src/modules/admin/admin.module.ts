import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AllowedDomain } from '../../database/entities/allowed-domain.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AllowedDomain])], // Đăng ký bảng AllowedDomain
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}