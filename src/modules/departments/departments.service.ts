import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Department } from '../../database/entities/department.entity';
import { User } from '../../database/entities/user.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

import { SystemLogsService } from '../system-logs/system-logs.service'; // Import service

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private departmentRepository: Repository<Department>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    private systemLogsService: SystemLogsService,
  ) {}

  async create(createDepartmentDto: CreateDepartmentDto, currentUser: User) {
    const existing = await this.departmentRepository.findOne({
      where: { name: createDepartmentDto.name },
    });
    if (existing) throw new ConflictException('Tên bộ môn đã tồn tại');

    const dept = this.departmentRepository.create(createDepartmentDto);
    // Lưu vào biến trước thay vì return luôn
    const savedDept = await this.departmentRepository.save(dept);

    // 👇 GỌI HÀM GHI LOG Ở ĐÂY
    if (this.systemLogsService) {
      await this.systemLogsService.createLog({
        userId: currentUser?.id,
        action: 'CREATE',
        resource: 'DEPARTMENT',
        message: `Tạo bộ môn mới: ${savedDept.name}`,
        details: { new: savedDept },
      });
    }

    return savedDept;
  }

  findAll() {
    return this.departmentRepository
      .find({
        order: { name: 'ASC' },
        relations: ['users'],
      })
      .then((depts) =>
        depts.map((d) => ({
          ...d,
          memberCount: d.users ? d.users.length : 0,
          users: undefined,
        })),
      );
  }

  // 👇 Đã check lại logic update cho mày
  async update(id: string, updateDepartmentDto: UpdateDepartmentDto, currentUser: any) {
    // 1. Check xem bộ môn có tồn tại không
    const department = await this.departmentRepository.findOne({ where: { id } });
    if (!department) {
      throw new NotFoundException('Không tìm thấy bộ môn');
    }

    // phải check trùng code với thằng khác
    if (updateDepartmentDto.code && updateDepartmentDto.code !== department.code) {
      const duplicate = await this.departmentRepository.findOne({
        where: {
          code: updateDepartmentDto.code,
          id: Not(id),
        },
      });

      if (duplicate) {
        throw new ConflictException('Mã bộ môn này đã được sử dụng');
      }
    }

    const oldData = { ...department };
    // 3. Update an toàn
    // Object.assign là OK, hoặc dùng this.departmentRepository.save({ ...department, ...dto })
    Object.assign(department, updateDepartmentDto);
    const updatedDept = await this.departmentRepository.save(department);
    if (this.systemLogsService) {
      await this.systemLogsService.createLog({
        userId: currentUser?.id,
        action: 'UPDATE', // Hành động: UPDATE
        resource: 'DEPARTMENT',
        message: `Cập nhật thông tin bộ môn: ${updatedDept.code}`,
        details: { old: oldData, new: updatedDept }, // 👈 Rất quan trọng
      });
    }

    return updatedDept;
  }

  async remove(id: string, currentUser: any) {
    const dept = await this.departmentRepository.findOne({ where: { id } });
    if (!dept) throw new NotFoundException('Không tìm thấy bộ môn');
    const deletedData = { ...dept };
    // Reset user về null trước khi xóa bộ môn
    await this.userRepository.update({ department: { id } }, { department: null as any });
    const result = await this.departmentRepository.remove(dept);

    if (this.systemLogsService) {
      await this.systemLogsService.createLog({
        userId: currentUser?.id,
        action: 'DELETE', // Hành động: DELETE (Màu đỏ trên UI)
        resource: 'DEPARTMENT',
        message: `Đã xóa bộ môn: ${deletedData.name} (${deletedData.code})`,
        details: { deleted: deletedData }, // Lưu lại để sau này biết đã xóa cái gì
      });
    }
    return result;
  }
}
