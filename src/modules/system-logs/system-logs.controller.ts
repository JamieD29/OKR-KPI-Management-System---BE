import { Controller, Get, Delete, UseGuards } from '@nestjs/common';
import { SystemLogsService } from './system-logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/role.decorator';
import { RoleType } from '../../common/enums/role.enum';

@Controller('system-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SystemLogsController {
  constructor(private readonly systemLogsService: SystemLogsService) { }

  // Chỉ Admin mới được xem Log
  @Get()
  @Roles(RoleType.ADMIN)
  findAll() {
    return this.systemLogsService.findAll();
  }

  // Xóa toàn bộ nhật ký — chỉ ADMIN
  @Delete()
  @Roles(RoleType.ADMIN)
  async clearAll() {
    await this.systemLogsService.clearAll();
    return { message: 'Đã xóa toàn bộ nhật ký hệ thống.' };
  }
}
