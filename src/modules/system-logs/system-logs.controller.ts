import { Controller, Get, UseGuards } from '@nestjs/common';
import { SystemLogsService } from './system-logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/role.guard'; // Chỉnh đường dẫn nếu cần
import { Roles } from '../auth/decorators/role.decorator';
import { RoleType } from '../../common/enums/role.enum';

@Controller('system-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SystemLogsController {
  constructor(private readonly systemLogsService: SystemLogsService) {}

  // Chỉ Admin mới được xem Log
  @Get()
  @Roles(RoleType.SUPER_ADMIN, RoleType.SYSTEM_ADMIN)
  findAll() {
    return this.systemLogsService.findAll();
  }
}
