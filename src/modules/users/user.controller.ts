import {
  Controller,
  Get,
  Body,
  Patch,
  Param, // 👈 Thêm cái này để lấy ID từ URL
  Put, // 👈 Thêm cái này để tạo method PUT
  UseGuards,
  Req,
} from '@nestjs/common';
import { UsersService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// 👇 IMPORT THÊM ĐỂ PHÂN QUYỀN (Check kỹ đường dẫn nhé)
import { Roles } from '../auth/decorators/role.decorator';
import { RolesGuard } from '../auth/guards/role.guard';
import { RoleType } from '../../common/enums/role.enum';

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

  // 1. Lấy danh sách user (Mày đã có, tao bổ sung import cho nó chạy)
  @Get()
  @Roles(RoleType.SUPER_ADMIN)
  async findAll() {
    return this.usersService.findAll();
  }

  // 2. Cập nhật quyền User (Cái nút SAVE gọi vào đây này) 🔥 QUAN TRỌNG
  @Put(':id/roles')
  @Roles(RoleType.SUPER_ADMIN) // Chỉ Trùm Cuối mới được đổi quyền
  async updateUserRoles(@Param('id') userId: string, @Body() body: { roles: RoleType[] }) {
    return this.usersService.updateRoles(userId, body.roles);
  }
}
