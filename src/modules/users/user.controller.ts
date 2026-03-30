import {
  Controller,
  Get,
  Body,
  Patch,
  Param, // 👈 Thêm cái này để lấy ID từ URL
  Put, // 👈 Thêm cái này để tạo method PUT
  Query, // 👈 Thêm để nhận query params (departmentId)
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// 👇 IMPORT THÊM ĐỂ PHÂN QUYỀN (Check kỹ đường dẫn nhé)
import { Roles } from '../auth/decorators/role.decorator';
import { RolesGuard } from '../auth/guards/role.guard';
import { RoleType } from '../../common/enums/role.enum';
import { PermissionLevel } from '../../database/entities/management-position.entity';

@Controller('users')
// 👇 Thêm RolesGuard vào đây để nó check quyền cho các hàm bên dưới
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  getProfile(@Req() req) {
    return this.usersService.findOne(req.user.id);
  }

  @Patch('profile')
  updateProfile(@Req() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, updateProfileDto);
  }

  // ==========================================
  // 👇 CÁC API DÀNH CHO ADMIN PORTAL
  // ==========================================

  // 1. Lấy danh sách user — hỗ trợ filter theo departmentId
  @Get()
  async findAll(@Req() req, @Query('departmentId') departmentId?: string) {
    const requester = await this.usersService.findOne(req.user.id);
    const isAdmin = requester.roles.some((r) => r.slug === RoleType.ADMIN);
    const mngLevel = requester.managementPosition?.permissionLevel;

    const isKhoa = mngLevel === PermissionLevel.KHOA || mngLevel === PermissionLevel.SYSTEM;
    const isDonVi = mngLevel === PermissionLevel.DON_VI;

    if (!isAdmin && !isKhoa && !isDonVi) {
      throw new ForbiddenException('Bạn không có quyền xem danh sách nhân sự');
    }

    if (isDonVi && !isAdmin && !isKhoa) {
      // Ép truy vấn phải thuộc department của requester nếu là đơn vị
      const filterDept = requester.department?.id;
      if (!departmentId || departmentId !== filterDept) {
        return this.usersService.findAll(filterDept);
      }
    }

    return this.usersService.findAll(departmentId);
  }

  // 2. Cập nhật quyền User (Cái nút SAVE gọi vào đây này) 🔥 QUAN TRỌNG
  @Put(':id/roles')
  @Roles(RoleType.ADMIN) // Chỉ Trùm Cuối mới được đổi quyền
  async updateUserRoles(@Param('id') userId: string, @Body() body: { roles: RoleType[] }) {
    return this.usersService.updateRoles(userId, body.roles);
  }

  // 3. Gán chức vụ quản lý cho User (Admin only)
  @Put(':id/management-position')
  @Roles(RoleType.ADMIN)
  async assignManagementPosition(
    @Param('id') userId: string,
    @Body() body: { positionId: string | null },
  ) {
    return this.usersService.assignManagementPosition(userId, body.positionId);
  }
}
