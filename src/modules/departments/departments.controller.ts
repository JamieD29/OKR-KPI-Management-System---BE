import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto'; // 👈 Import DTO update
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/role.guard'; // Hoặc roles.guard tùy tên file mày
import { Roles } from '../auth/decorators/role.decorator';
import { RoleType } from '../../common/enums/role.enum'; // 👈 QUAN TRỌNG: Import Enum

@Controller('departments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @Roles(RoleType.ADMIN) // 👈 Dùng Enum cho chuẩn
  create(@Body() createDepartmentDto: CreateDepartmentDto, @Req() req: any) {
    return this.departmentsService.create(createDepartmentDto, req.user);
  }

  @Get()
  findAll() {
    return this.departmentsService.findAll();
  }

  @Patch(':id')
  @Roles(RoleType.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
    @Req() req: any,
  ) {
    // ⚠️ Lần trước mày gọi nhầm remove() ở đây, giờ sửa lại thành update()
    return this.departmentsService.update(id, updateDepartmentDto, req.user);
  }

  @Delete(':id')
  @Roles(RoleType.ADMIN)
  remove(@Param('id') id: string, @Req() req: any) {
    return this.departmentsService.remove(id, req.user);
  }
}
