import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

export interface Department {
  id: number;
  name: string;
  parent_id?: number | null;
  manager_id?: number | null;
}

@Injectable()
export class DepartmentService {
  private departments: Department[] = [];
  private idCounter = 1;

  findAll(): Department[] {
    return this.departments;
  }

  findOne(id: number): Department {
    const department = this.departments.find((d) => d.id === id);
    if (!department) {
      throw new NotFoundException('Department not found');
    }
    return department;
  }

  create(dto: CreateDepartmentDto): Department {
    const department: Department = {
      id: this.idCounter++,
      name: dto.name,
      parent_id: dto.parent_id ?? null,
      manager_id: dto.manager_id ?? null,
    };

    this.departments.push(department);
    return department;
  }

  update(id: number, dto: UpdateDepartmentDto): Department {
    const department = this.findOne(id);

    if (dto.name !== undefined) department.name = dto.name;
    if (dto.parent_id !== undefined) department.parent_id = dto.parent_id;
    if (dto.manager_id !== undefined) department.manager_id = dto.manager_id;

    return department;
  }

  remove(id: number): { message: string } {
    const index = this.departments.findIndex((d) => d.id === id);
    if (index === -1) {
      throw new NotFoundException('Department not found');
    }

    this.departments.splice(index, 1);
    return { message: 'Department deleted successfully' };
  }
}
