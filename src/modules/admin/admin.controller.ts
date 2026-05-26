import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { DatabaseSeederService } from '../../database/database-seeder.service';
import { AddDomainDto } from './dto/add-domain.dto';
import {
  AdminListDomainsResponseDto,
  AdminCreateDomainResponseDto,
} from './dto/admin-domains-response.dto';
import { AdminMessageResponseDto } from './dto/admin-message-response.dto';

@ApiTags('admin')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description:
    'Thiếu header **Authorization** dạng **Bearer** kèm token, hoặc JWT không hợp lệ / hết hạn.',
})
@ApiForbiddenResponse({
  description: 'JWT hợp lệ nhưng không đủ quyền ADMIN.',
})
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly seederService: DatabaseSeederService,
  ) {}

  @Get('domains')
  @ApiOperation({
    summary: 'Danh sách allowed domains',
    description:
      'Trả về mọi bản ghi **AllowedDomain**, sắp **addedAt** giảm dần. Mỗi phần tử có thêm **userCount** (số user có email thuộc domain đó).',
  })
  @ApiOkResponse({
    description: 'Danh sách domain kèm số user sử dụng',
    type: AdminListDomainsResponseDto,
  })
  @ApiInternalServerErrorResponse({
    description: 'Lỗi DB khi đếm user hoặc truy vấn bảng **allowed_domains**.',
  })
  getAllDomains() {
    return this.adminService.findAll();
  }

  @Post('domains')
  @ApiOperation({
    summary: 'Thêm allowed domain',
    description:
      'Thêm tên miền mới vào bảng **allowed_domains**. Domain trùng → **409** với *Domain already exists*.',
  })
  @ApiBody({ type: AddDomainDto })
  @ApiOkResponse({
    description: 'Bản ghi domain vừa tạo',
    type: AdminCreateDomainResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Body thiếu trường **domain** hoặc **domain** rỗng (ValidationPipe).',
  })
  @ApiConflictResponse({
    description:
      '*Domain already exists* — domain đã tồn tại (unique constraint).',
  })
  @ApiInternalServerErrorResponse({ description: 'Lỗi khi lưu DB.' })
  addDomain(@Body() dto: AddDomainDto) {
    return this.adminService.create(dto.domain);
  }

  @Delete('domains/:id')
  @ApiOperation({
    summary: 'Xóa allowed domain theo id',
    description:
      'Ràng buộc: domain phải tồn tại; sau khi xóa vẫn còn ít nhất một domain; không được còn user nào dùng domain này.',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'UUID của bản ghi **AllowedDomain**.',
  })
  @ApiOkResponse({
    description: 'Xóa thành công',
    type: AdminMessageResponseDto,
  })
  @ApiNotFoundResponse({ description: '*Domain not found* — sai id.' })
  @ApiConflictResponse({
    description:
      'Hệ thống phải còn ít nhất 1 domain, hoặc còn user đang dùng domain này (message tiếng Việt kèm số lượng).',
  })
  @ApiInternalServerErrorResponse({ description: 'Lỗi DB khi xóa.' })
  deleteDomain(@Param('id') id: string) {
    return this.adminService.remove(id);
  }

  @Post('system/reset')
  @ApiOperation({
    summary: 'Factory reset toàn hệ thống',
    description:
      'Gọi **DatabaseSeederService.factoryReset()**: làm trống (truncate cascade) các bảng nghiệp vụ rồi seed lại vai trò, **allowed_domains**, khoa mặc định.\n\n' +
      '**Cảnh báo:** xóa toàn bộ user, OKR, log, notification… Không thể hoàn tác. Body không bắt buộc.',
  })
  @ApiOkResponse({
    description:
      'Reset hoàn tất. Message cố định: *Hệ thống đã được khôi phục về cài đặt gốc thành công!*',
    type: AdminMessageResponseDto,
  })
  @ApiInternalServerErrorResponse({
    description:
      'TRUNCATE/seed thất bại (thiếu bảng, lỗi kết nối DB, v.v.); DB có thể ở trạng thái không nhất quán.',
  })
  async factoryReset() {
    await this.seederService.factoryReset();
    return { message: 'Hệ thống đã được khôi phục về cài đặt gốc thành công!' };
  }

  @Get('dashboard')
  @ApiOperation({
    summary: 'Thống kê tổng hợp cho Admin Dashboard',
    description:
      'Trả về số liệu người dùng: tổng users, users active 30 ngày, users chưa setup profile.',
  })
  @ApiOkResponse({ description: 'Thống kê admin dashboard' })
  @ApiInternalServerErrorResponse({ description: 'Lỗi DB khi thống kê.' })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('system-health')
  @ApiOperation({
    summary: 'Sức khỏe hệ thống: CPU, RAM, Uptime',
    description:
      'Trả về thông tin CPU load, RAM usage, uptime server và thông tin Node.js process. Dữ liệu lấy từ Node.js os module — dùng cho Admin Dashboard System Health panel.',
  })
  @ApiOkResponse({ description: 'Thông tin system health theo thời gian thực' })
  async getSystemHealth() {
    return this.adminService.getSystemHealth();
  }
}
