import { Controller, Get, Delete, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { SystemLogsService } from './system-logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/role.decorator';
import { RoleType } from '../../common/enums/role.enum';
import {
  SystemLogItemDto,
  ClearSystemLogsResponseDto,
} from './dto/system-log-swagger.dto';

@ApiTags('system-logs')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description:
    'Thiếu `Authorization: Bearer <token>` hoặc JWT không hợp lệ / hết hạn.',
})
@Controller('system-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SystemLogsController {
  constructor(private readonly systemLogsService: SystemLogsService) {}

  @Get()
  @Roles(RoleType.ADMIN)
  @ApiOperation({
    summary: 'Danh sách nhật ký hệ thống',
    description:
      'Chỉ **ADMIN**. Mọi bản ghi `system_logs`, quan hệ `user`, sort `createdAt DESC`.',
  })
  @ApiOkResponse({
    description: 'Mảng log',
    type: SystemLogItemDto,
    isArray: true,
  })
  @ApiForbiddenResponse({
    description: 'Không có role ADMIN (`RolesGuard`).',
  })
  @ApiInternalServerErrorResponse({ description: 'Lỗi DB khi truy vấn.' })
  findAll() {
    return this.systemLogsService.findAll();
  }

  @Delete()
  @Roles(RoleType.ADMIN)
  @ApiOperation({
    summary: 'Xóa toàn bộ nhật ký',
    description:
      'Chỉ **ADMIN**. `Repository.clear()` trên bảng `system_logs` — **không thể hoàn tác**.',
  })
  @ApiOkResponse({
    description: 'Thông báo sau khi xóa',
    type: ClearSystemLogsResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Không có role ADMIN.' })
  @ApiInternalServerErrorResponse({ description: 'Lỗi khi xóa (DB).' })
  async clearAll() {
    await this.systemLogsService.clearAll();
    return { message: 'Đã xóa toàn bộ nhật ký hệ thống.' };
  }
}
