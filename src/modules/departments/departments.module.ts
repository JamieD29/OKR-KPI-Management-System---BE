import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepartmentsService } from './departments.service';
import { DepartmentsController } from './departments.controller';
import { Department } from '../../database/entities/department.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Department])], // 👈 Phải có dòng này kết nối Entity
  controllers: [DepartmentsController],
  providers: [DepartmentsService],
})
export class DepartmentsModule {}
