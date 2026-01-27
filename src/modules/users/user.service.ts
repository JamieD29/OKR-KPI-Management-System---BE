import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// 👇 Import đúng đường dẫn Entity trong Database
import { User } from '../../database/entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // ... Các hàm cũ (create, findAll...) giữ nguyên

  // 👇 THÊM HÀM NÀY
  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Tách departmentId ra khỏi dto để xử lý riêng
    const { departmentId, ...rest } = updateProfileDto;

    // 1. Map các trường bình thường
    Object.assign(user, rest);

    // 2. Xử lý quan hệ Bộ môn (Nếu có gửi ID lên)
    if (departmentId) {
      // Lưu ý: TypeORM thông minh, chỉ cần gán object có id là nó tự hiểu
      user.department = { id: departmentId } as any;
    }

    return this.userRepository.save(user);
  }

  // Hàm findOne helper (nếu chưa có thì thêm vào để Controller dùng)
  async findOne(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles', 'department'], // Load luôn Role và Dept để hiển thị
    });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return user;
  }
}
