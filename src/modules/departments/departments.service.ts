import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Department } from '../../database/entities/department.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private departmentRepository: Repository<Department>,
  ) {}

  // 1. Tạo bộ môn mới (Cho Admin dùng sau này)
  async create(createDepartmentDto: CreateDepartmentDto) {
    // Check trùng tên
    const existing = await this.departmentRepository.findOne({
      where: { name: createDepartmentDto.name },
    });
    if (existing) throw new ConflictException('Tên bộ môn đã tồn tại');

    const dept = this.departmentRepository.create(createDepartmentDto);
    return this.departmentRepository.save(dept);
  }

  // 2. Lấy tất cả (Dùng cho Dropdown Profile & Trang Admin)
  findAll() {
    return this.departmentRepository
      .find({
        order: { name: 'ASC' },
        relations: ['users'], // 👈 JOIN bảng users để đếm
      })
      .then((depts) =>
        depts.map((d) => ({
          ...d,
          memberCount: d.users.length, // Trả thêm trường đếm số người
          // Xóa danh sách users để response nhẹ (nếu không cần hiện tên user ở list)
          users: undefined,
        })),
      );
  }

  async update(id: string, updateDepartmentDto: UpdateDepartmentDto) {
    // 1. Tìm xem bộ môn này có tồn tại không
    const department = await this.departmentRepository.findOne({ where: { id } });
    if (!department) {
      throw new NotFoundException('Không tìm thấy bộ môn');
    }

    // 2. Nếu người dùng có sửa Mã bộ môn -> Check trùng
    if (updateDepartmentDto.code) {
      // Tìm xem có thằng nào KHÁC (Not id) đang dùng mã này không
      const duplicate = await this.departmentRepository.findOne({
        where: {
          code: updateDepartmentDto.code,
          id: Not(id), // 👈 Quan trọng: Trùng mã nhưng phải là thằng khác, chứ chính nó thì ko sao
        },
      });

      if (duplicate) {
        throw new ConflictException('Mã bộ môn này đã được sử dụng bởi bộ môn khác');
      }
    }

    // 3. Update và Lưu
    Object.assign(department, updateDepartmentDto);
    return this.departmentRepository.save(department);
  }

  // 3. Xóa bộ môn
  async remove(id: string) {
    await this.departmentRepository.delete(id);
    return { message: 'Đã xóa thành công' };
  }
}
