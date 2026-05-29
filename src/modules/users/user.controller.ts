import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Put,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { UsersService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserRolesDto } from './dto/update-user-roles.dto';
import { AssignManagementPositionDto } from './dto/assign-management-position.dto';
import { AssignDepartmentDto } from './dto/assign-department.dto';
import {
  ProfileOptionsResponseDto,
  UserDetailSwaggerDto,
} from './dto/user-api-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DatabaseSeederService } from '../../database/database-seeder.service';
import { Roles } from '../auth/decorators/role.decorator';
import { RolesGuard } from '../auth/guards/role.guard';
import { RoleType } from '../../common/enums/role.enum';
import { PermissionLevel } from '../../database/entities/management-position.entity';
import { JobTitle } from '../../database/entities/user.entity';

@ApiTags('users')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description:
    'Thiếu header **Authorization** dạng **Bearer** kèm token, hoặc JWT không hợp lệ / hết hạn (guard JWT).',
})
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly seederService: DatabaseSeederService,
  ) {}

  @Get('profile-options')
  @ApiOperation({
    summary: 'Lựa chọn enum hồ sơ (job title, học hàm, học vị, giới tính)',
    description:
      'Nguồn dữ liệu duy nhất cho FE: map từ enum trong entity User qua **getProfileOptions** của DatabaseSeeder. Mỗi mục có **value**, **label**, **key**.',
  })
  @ApiOkResponse({
    description: 'Các nhóm lựa chọn cho form profile',
    type: ProfileOptionsResponseDto,
  })
  @ApiInternalServerErrorResponse({ description: 'Lỗi không mong đợi khi build options.' })
  getProfileOptions() {
    return this.seederService.getProfileOptions();
  }

  @Get('profile')
  @ApiOperation({
    summary: 'Hồ sơ user đang đăng nhập',
    description:
      'Truy vấn user theo id trong JWT — kèm **roles**, **department**, **managementPosition**.',
  })
  @ApiOkResponse({
    description: 'Chi tiết user',
    type: UserDetailSwaggerDto,
  })
  @ApiNotFoundResponse({
    description:
      '*User with ID … not found* — token JWT trỏ tới id không còn trong DB.',
  })
  @ApiInternalServerErrorResponse({ description: 'Lỗi DB.' })
  getProfile(@Req() req) {
    return this.usersService.findOne(req.user.id);
  }

  @Patch('profile')
  @ApiOperation({
    summary: 'Cập nhật hồ sơ cá nhân',
    description:
      'Chỉ các field gửi lên mới được cập nhật. **departmentId** gán quan hệ **department**.',
  })
  @ApiBody({ type: UpdateProfileDto })
  @ApiOkResponse({
    description: 'User sau khi lưu',
    type: UserDetailSwaggerDto,
  })
  @ApiBadRequestResponse({
    description: 'ValidationPipe: enum/số/ngày UUID không hợp lệ.',
  })
  @ApiNotFoundResponse({ description: 'User không tồn tại.' })
  @ApiInternalServerErrorResponse({ description: 'Lỗi khi lưu DB.' })
  updateProfile(@Req() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, updateProfileDto);
  }

  @Get('filter-by-role')
  @ApiOperation({
    summary: 'Lọc user theo chức vụ quản lý và/hoặc chức danh nghề nghiệp',
    description:
      'Logic **findByRole**: lọc theo **managementPosition.id** và **jobTitle** (enum). Hai query đều tùy chọn; không filter thì trả toàn bộ user (điều kiện ORM).',
  })
  @ApiQuery({
    name: 'positionId',
    required: false,
    format: 'uuid',
    description: 'UUID bản ghi **management_positions**.',
  })
  @ApiQuery({
    name: 'jobTitle',
    required: false,
    enum: JobTitle,
    description: 'Giá trị enum **JobTitle** (tiếng Việt như trong entity).',
  })
  @ApiOkResponse({
    description: 'Mảng user, sort **name** tăng dần',
    type: UserDetailSwaggerDto,
    isArray: true,
  })
  @ApiInternalServerErrorResponse()
  async findByRole(
    @Query('positionId') positionId?: string,
    @Query('jobTitle') jobTitle?: string,
  ) {
    return this.usersService.findByRole(positionId, jobTitle);
  }

  @Get()
  @ApiOperation({
    summary: 'Danh sách nhân sự (Admin / quản lý cấp khoa-đơn vị)',
    description:
      'Tham số **departmentId** tùy chọn. **Phân quyền:** chỉ ADMIN, **permissionLevel** SYSTEM/KHOA, hoặc DON_VI được xem; DON_VI không phải admin/khoa bị ép lọc theo bộ môn của chính họ (bỏ qua departmentId lạ). Trái phép → **403 Forbidden**.',
  })
  @ApiQuery({
    name: 'departmentId',
    required: false,
    format: 'uuid',
    description: 'Lọc theo UUID bộ môn (**departments.id**) khi được phép.',
  })
  @ApiOkResponse({
    description: 'Danh sách user, sort **createdAt** giảm dần',
    type: UserDetailSwaggerDto,
    isArray: true,
  })
  @ApiForbiddenResponse({
    description:
      '*Bạn không có quyền xem danh sách nhân sự* hoặc guard vai trò từ chối.',
  })
  @ApiInternalServerErrorResponse()
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
      const filterDept = requester.department?.id;
      if (!departmentId || departmentId !== filterDept) {
        return this.usersService.findAll(filterDept);
      }
    }

    return this.usersService.findAll(departmentId);
  }

  @Put(':id/roles')
  @Roles(RoleType.ADMIN)
  @ApiOperation({
    summary: 'Gán lại roles cho user (chỉ ADMIN)',
    description:
      'Slug được chuẩn hóa in hoa trong service. Không role nào khớp DB → **400**.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'User id' })
  @ApiBody({ type: UpdateUserRolesDto })
  @ApiOkResponse({
    description: 'User sau khi cập nhật roles',
    type: UserDetailSwaggerDto,
  })
  @ApiForbiddenResponse({
    description: 'Không có role ADMIN (guard vai trò).',
  })
  @ApiBadRequestResponse({
    description:
      '*Role không hợp lệ hoặc không tìm thấy trong DB* — payload roles rỗng hoặc slug không tồn tại.',
  })
  @ApiNotFoundResponse({ description: 'User với **id** không tồn tại.' })
  @ApiInternalServerErrorResponse()
  async updateUserRoles(@Param('id') userId: string, @Body() body: UpdateUserRolesDto) {
    return this.usersService.updateRoles(userId, body.roles);
  }

  @Put(':id/management-position')
  @Roles(RoleType.ADMIN)
  @ApiOperation({
    summary: 'Gán / gỡ chức vụ quản lý (chỉ ADMIN)',
    description:
      '**positionId** là UUID hoặc *null* để gỡ chức vụ. Gửi thông báo cho user khi gán/gỡ.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'User id' })
  @ApiBody({ type: AssignManagementPositionDto })
  @ApiOkResponse({
    description: 'User sau khi cập nhật **managementPosition**',
    type: UserDetailSwaggerDto,
  })
  @ApiForbiddenResponse({ description: 'Không có role ADMIN.' })
  @ApiNotFoundResponse({
    description:
      'User không tồn tại, hoặc **positionId** không khớp bảng **management_positions**.',
  })
  @ApiInternalServerErrorResponse({ description: 'Lỗi DB hoặc tạo notification.' })
  async assignManagementPosition(
    @Param('id') userId: string,
    @Body() body: AssignManagementPositionDto,
  ) {
    return this.usersService.assignManagementPosition(
      userId,
      body.positionId ?? null,
    );
  }

  @Put(':id/department')
  @Roles(RoleType.ADMIN)
  @ApiOperation({
    summary: 'Gán / gỡ bộ môn của user (chỉ ADMIN)',
    description:
      '**departmentId** là UUID hoặc *null* để gỡ khỏi bộ môn. Gửi thông báo cho user khi thay đổi.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'User id' })
  @ApiBody({ type: AssignDepartmentDto })
  @ApiOkResponse({
    description: 'User sau khi cập nhật **department**',
    type: UserDetailSwaggerDto,
  })
  @ApiForbiddenResponse({ description: 'Không có role ADMIN.' })
  @ApiNotFoundResponse({
    description:
      'User không tồn tại, hoặc **departmentId** không khớp bảng **departments**.',
  })
  @ApiInternalServerErrorResponse({ description: 'Lỗi DB hoặc tạo notification.' })
  async assignDepartment(
    @Param('id') userId: string,
    @Body() body: AssignDepartmentDto,
  ) {
    return this.usersService.assignDepartment(
      userId,
      body.departmentId ?? null,
    );
  }

  @Get(':id/detail')
  @ApiOperation({
    summary: 'Lấy toàn bộ thông tin chi tiết nhân sự (Profile, OKRs, Đánh giá) theo kỳ',
    description: 'Dành cho Quản lý / Admin xem hồ sơ chi tiết của nhân viên.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'User id' })
  @ApiQuery({ name: 'cycleId', required: false, description: 'ID của kỳ đánh giá (mặc định lấy kỳ mới nhất)' })
  @ApiOkResponse({ description: 'Thông tin chi tiết nhân sự' })
  @ApiNotFoundResponse({ description: 'User không tồn tại.' })
  @ApiInternalServerErrorResponse()
  async getUserDetail(@Param('id') userId: string, @Query('cycleId') cycleId?: string) {
    return this.usersService.getUserDetail(userId, cycleId);
  }
}
