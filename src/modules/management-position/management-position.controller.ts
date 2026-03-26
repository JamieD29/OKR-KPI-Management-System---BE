import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ManagementPositionService } from './management-position.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/role.decorator';
import { RoleType } from '../../common/enums/role.enum';
import { PermissionLevel } from '../../database/entities/management-position.entity';

@Controller('management-positions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ManagementPositionController {
  constructor(private readonly positionService: ManagementPositionService) {}

  // GET /management-positions — Lấy tất cả (ai đăng nhập cũng xem được)
  @Get()
  findAll() {
    return this.positionService.findAll();
  }

  // POST /management-positions — Tạo mới (Chỉ Admin)
  @Post()
  @Roles(RoleType.ADMIN)
  create(
    @Body()
    body: {
      name: string;
      slug: string;
      description?: string;
      permissionLevel?: PermissionLevel;
    },
  ) {
    return this.positionService.create(body);
  }

  // PATCH /management-positions/:id — Cập nhật (Chỉ Admin)
  @Patch(':id')
  @Roles(RoleType.ADMIN)
  update(
    @Param('id') id: string,
    @Body()
    body: { name?: string; slug?: string; description?: string; permissionLevel?: PermissionLevel },
  ) {
    return this.positionService.update(id, body);
  }

  // DELETE /management-positions/:id — Xóa (Chỉ Admin)
  @Delete(':id')
  @Roles(RoleType.ADMIN)
  remove(@Param('id') id: string) {
    return this.positionService.remove(id);
  }
}
