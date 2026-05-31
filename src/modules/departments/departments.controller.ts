import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import {
  DepartmentEntityResponseDto,
  DepartmentListItemDto,
} from './dto/department-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/role.decorator';
import { RoleType } from '../../common/enums/role.enum';

@ApiTags('departments')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description:
    'Thiếu header **Authorization** dạng **Bearer** kèm token, hoặc JWT không hợp lệ / hết hạn.',
})
@Controller('departments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @Roles(RoleType.ADMIN)
  @ApiOperation({
    summary: 'Tạo bộ môn (ADMIN)',
    description:
      'Kiểm tra trùng **name**. Ghi **system_logs**. Trả entity department vừa lưu.',
  })
  @ApiBody({ type: CreateDepartmentDto })
  @ApiOkResponse({
    description: 'Department đã tạo',
    type: DepartmentEntityResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Validation DTO (name/code/description).' })
  @ApiForbiddenResponse({ description: 'Không có role ADMIN (guard vai trò).' })
  @ApiConflictResponse({
    description: '*Tên bộ môn đã tồn tại* — trùng **name** trong DB.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Lỗi DB hoặc ghi system log.',
  })
  create(@Body() createDepartmentDto: CreateDepartmentDto, @Req() req: any) {
    return this.departmentsService.create(createDepartmentDto, req.user);
  }

  @Get()
  @ApiOperation({
    summary: 'Danh sách bộ môn',
    description:
      'Mọi user đăng nhập. Sort **name** tăng dần. Mỗi phần tử có **memberCount**; quan hệ **users** không xuất hiện trong JSON (đã loại bỏ).',
  })
  @ApiOkResponse({
    description: 'Danh sách department kèm số thành viên',
    type: DepartmentListItemDto,
    isArray: true,
  })
  @ApiInternalServerErrorResponse({ description: 'Lỗi DB.' })
  findAll(@Req() req: any) {
    return this.departmentsService.findAll(req.user);
  }

  @Patch(':id')
  @Roles(RoleType.ADMIN)
  @ApiOperation({
    summary: 'Cập nhật bộ môn (ADMIN)',
    description:
      'Nếu đổi **code**, kiểm tra trùng với bộ môn khác. Ghi **system_logs** (giá trị cũ / mới).',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID bộ môn (**departments.id**).' })
  @ApiBody({ type: UpdateDepartmentDto })
  @ApiOkResponse({
    description: 'Department sau khi cập nhật',
    type: DepartmentEntityResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Validation DTO.' })
  @ApiForbiddenResponse({ description: 'Không có role ADMIN.' })
  @ApiNotFoundResponse({ description: '*Không tìm thấy bộ môn*.' })
  @ApiConflictResponse({
    description: '*Mã bộ môn này đã được sử dụng* — **code** trùng bản ghi khác.',
  })
  @ApiInternalServerErrorResponse({ description: 'Lỗi DB hoặc system log.' })
  update(
    @Param('id') id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
    @Req() req: any,
  ) {
    return this.departmentsService.update(id, updateDepartmentDto, req.user);
  }

  @Delete(':id')
  @Roles(RoleType.ADMIN)
  @ApiOperation({
    summary: 'Xóa bộ môn (ADMIN)',
    description:
      'Gỡ liên kết bộ môn khỏi mọi user thuộc bộ môn đó (**department** đặt *null*) rồi xóa bản ghi. Ghi **system_logs**.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({
    description: 'Entity department vừa xóa (thao tác remove DB).',
    type: DepartmentEntityResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Không có role ADMIN.' })
  @ApiNotFoundResponse({ description: '*Không tìm thấy bộ môn*.' })
  @ApiInternalServerErrorResponse({ description: 'Lỗi DB hoặc system log.' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.departmentsService.remove(id, req.user);
  }
}
