import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Department } from '../../database/entities/department.entity';
import { User } from '../../database/entities/user.entity'; // 👈 IMPORT THÊM CÁI NÀY
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private departmentRepository: Repository<Department>,

    @InjectRepository(User) // 👈 INJECT THÊM CÁI NÀY ĐỂ SỬ DỤNG ĐƯỢC userRepository
    private userRepository: Repository<User>,
  ) {}

  // 1. Tạo bộ môn mới
  async create(createDepartmentDto: CreateDepartmentDto) {
    // Check trùng tên
    const existing = await this.departmentRepository.findOne({
      where: { name: createDepartmentDto.name },
    });
    if (existing) throw new ConflictException('Tên bộ môn đã tồn tại');

    const dept = this.departmentRepository.create(createDepartmentDto);
    return this.departmentRepository.save(dept);
  }

  // 2. Lấy tất cả (Kèm số lượng thành viên)
  findAll() {
    return this.departmentRepository
      .find({
        order: { name: 'ASC' },
        relations: ['users'], // JOIN bảng users để đếm
      })
      .then((depts) =>
        depts.map((d) => ({
          ...d,
          memberCount: d.users ? d.users.length : 0, // Check null cho chắc
          users: undefined, // Ẩn danh sách user cho nhẹ
        })),
      );
  }

  // 3. Update bộ môn
  async update(id: string, updateDepartmentDto: UpdateDepartmentDto) {
    const department = await this.departmentRepository.findOne({ where: { id } });
    if (!department) {
      throw new NotFoundException('Không tìm thấy bộ môn');
    }

    // Check trùng mã code (nếu có sửa code)
    if (updateDepartmentDto.code) {
      const duplicate = await this.departmentRepository.findOne({
        where: {
          code: updateDepartmentDto.code,
          id: Not(id),
        },
      });

      if (duplicate) {
        throw new ConflictException('Mã bộ môn này đã được sử dụng bởi bộ môn khác');
      }
    }

    Object.assign(department, updateDepartmentDto);
    return this.departmentRepository.save(department);
  }

  // 4. Xóa bộ môn (Đã Fix lỗi Foreign Key)
  async remove(id: string) {
    const dept = await this.departmentRepository.findOne({ where: { id } });
    if (!dept) throw new NotFoundException('Không tìm thấy bộ môn');

    // BƯỚC 1: Set department = null cho tất cả user đang thuộc bộ môn này
    // Bây giờ 'this.userRepository' đã được inject nên chạy ngon lành
    await this.userRepository.update({ department: { id: id } }, { department: null as any });

    // BƯỚC 2: Xóa bộ môn
    return this.departmentRepository.remove(dept);
  }
}
