import { Controller, Patch, Get, Post, Body, Delete, Param, UseGuards } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/role.decorator';
import { RolesGuard } from '../auth/guards/role.guard';
import { CreateDepartmentDto } from './dto/create-department.dto';

@Controller('departments')
@UseGuards(JwtAuthGuard, RolesGuard) // 👈 Kích hoạt bảo vệ 2 lớp
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @Roles('SYSTEM_ADMIN') // 👈 Chỉ cho phép SYSTEM_ADMIN tạo bộ môn
  create(@Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentsService.create(createDepartmentDto);
  }

  @Get()
  findAll() {
    return this.departmentsService.findAll();
  }

  @Delete(':id')
  @Roles('SYSTEM_ADMIN') // 👈 Chỉ cho phép SYSTEM_ADMIN xóa bộ môn
  remove(@Param('id') id: string) {
    return this.departmentsService.remove(id);
  }

  @Patch(':id')
  @Roles('SYSTEM_ADMIN') // 👈 Chỉ cho phép SYSTEM_ADMIN xóa bộ môn
  update(@Param('id') id: string) {
    return this.departmentsService.remove(id);
  }
}
