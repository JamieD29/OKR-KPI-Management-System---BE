import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Objective } from '../../database/entities/objective.entity';

@Injectable()
export class OkrService {
  constructor(
    @InjectRepository(Objective)
    private objectiveRepo: Repository<Objective>,
  ) {}

  // Hàm LƯU OKR MỚI
  async createDepartmentOkr(data: any) {
    try {
      console.log('🔄 Đang tiến hành map dữ liệu...');
      const newObjective = this.objectiveRepo.create({
        title: data.title,
        type: data.type,
        cycleId: data.cycleId,
        departmentId: data.departmentId,
        status: 'ON_TRACK',
        progress: 0,
        keyResults: data.keyResults,
      });

      console.log('🔄 Đang lưu xuống Database...');
      // Dùng await để bắt lỗi nếu Database từ chối
      const result = await this.objectiveRepo.save(newObjective);
      console.log('✅ Lưu thành công!');
      return result;
    } catch (error) {
      // 🚨 BẮT LỖI TẠI TRẬN: In ra Terminal Backend
      console.error('❌ LỖI DATABASE KHI LƯU OKR:');
      console.error(error);

      // Bọc lỗi ném về Frontend để mờ F12 Network xem được luôn
      throw new InternalServerErrorException(`Lỗi khi lưu OKR: ${error.message}`);
    }
  }

  // Hàm LẤY DANH SÁCH OKR
  async getDepartmentOkrs() {
    return this.objectiveRepo.find({
      where: { type: 'DEPARTMENT' },
      relations: ['keyResults'], // Quan trọng: Kéo theo cả mảng KR lên
      order: { createdAt: 'DESC' },
    });
  }
}
