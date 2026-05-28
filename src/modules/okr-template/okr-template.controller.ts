import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { OkrTemplateService } from './okr-template.service';
import {
  CreateOkrTemplateDto,
  UpdateOkrTemplateDto,
  ApplyTemplateDto,
} from './dto/okr-template-request.dto';
import {
  JobTitleOptionDto,
  OkrTemplateSwaggerDto,
  RemoveOkrTemplateResponseDto,
  ApplyTemplateResponseDto,
} from './dto/okr-template-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('okr-templates')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Thiếu hoặc sai token JWT.',
})
@UseGuards(JwtAuthGuard)
@Controller('okr-templates')
export class OkrTemplateController {
  constructor(private readonly okrTemplateService: OkrTemplateService) {}

  @Get()
  @ApiOperation({
    summary: 'Danh sách template OKR',
    description:
      'Yêu cầu JWT. Phân quyền: ADMIN thấy tất cả, các chức vụ quản lý khác chỉ thấy template họ tự tạo.',
  })
  @ApiQuery({
    name: 'departmentId',
    required: false,
    format: 'uuid',
    description: 'Lọc theo cột **department_id** của bảng template (Chỉ áp dụng với ADMIN).',
  })
  @ApiOkResponse({ type: OkrTemplateSwaggerDto, isArray: true })
  @ApiInternalServerErrorResponse()
  findAll(@Request() req: any, @Query('departmentId') departmentId?: string) {
    console.log('[DEBUG okr-templates GET] req.user:', req.user);
    const userId = req.user?.id || req.user?.sub;
    const userRoles = req.user?.roles || [];

    const isAdmin = userRoles.some((role: any) => {
      const roleSlug = typeof role === 'string' ? role : role.slug;
      return roleSlug === 'ADMIN';
    });

    if (isAdmin) {
      if (departmentId) {
        return this.okrTemplateService.findByDepartment(departmentId);
      }
      return this.okrTemplateService.findAll();
    } else {
      // Các chức vụ quản lý khác -> Chỉ trả về template do chính họ tạo ra
      return this.okrTemplateService.findByCreator(userId);
    }
  }

  @Get('job-titles')
  @ApiOperation({
    summary: 'Lựa chọn chức danh nghề nghiệp',
    description: 'Ánh xạ từ enum **JobTitle** trong entity User (value / label / key).',
  })
  @ApiOkResponse({ type: JobTitleOptionDto, isArray: true })
  getJobTitles() {
    return this.okrTemplateService.getJobTitles();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết một template' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: OkrTemplateSwaggerDto })
  @ApiNotFoundResponse({
    description: '*Template with ID … not found*.',
  })
  @ApiInternalServerErrorResponse()
  findOne(@Param('id') id: string) {
    return this.okrTemplateService.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Tạo template',
    description:
      'Yêu cầu JWT. Tự động gắn createdByUserId và createdByName từ user đăng nhập.',
  })
  @ApiBody({ type: CreateOkrTemplateDto })
  @ApiOkResponse({ type: OkrTemplateSwaggerDto })
  @ApiBadRequestResponse({
    description: 'Validation DTO hoặc tổng **maxScore** khác 100.',
  })
  @ApiInternalServerErrorResponse()
  create(@Body() createDto: CreateOkrTemplateDto, @Request() req: any) {
    console.log('[DEBUG okr-templates POST] req.user:', req.user);
    const userId = req.user?.id || req.user?.sub;
    return this.okrTemplateService.create(createDto, userId);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Cập nhật template',
    description: 'Nếu gửi **structure** mới: cùng quy tắc tổng điểm = 100.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: UpdateOkrTemplateDto })
  @ApiOkResponse({ type: OkrTemplateSwaggerDto })
  @ApiBadRequestResponse({ description: 'Tổng **maxScore** không hợp lệ.' })
  @ApiNotFoundResponse({ description: 'Template không tồn tại.' })
  @ApiInternalServerErrorResponse()
  update(@Param('id') id: string, @Body() updateDto: UpdateOkrTemplateDto, @Request() req: any) {
    const userId = req.user?.id || req.user?.sub;
    const userRoles = req.user?.roles || [];
    const isAdmin = userRoles.some((role: any) => {
      const roleSlug = typeof role === 'string' ? role : role.slug;
      return roleSlug === 'ADMIN';
    });
    return this.okrTemplateService.update(id, updateDto, userId, isAdmin);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa template' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: RemoveOkrTemplateResponseDto })
  @ApiNotFoundResponse({ description: 'Template không tồn tại.' })
  @ApiInternalServerErrorResponse()
  remove(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.id || req.user?.sub;
    const userRoles = req.user?.roles || [];
    const isAdmin = userRoles.some((role: any) => {
      const roleSlug = typeof role === 'string' ? role : role.slug;
      return roleSlug === 'ADMIN';
    });
    return this.okrTemplateService.remove(id, userId, isAdmin);
  }

  @Post(':id/apply')
  @ApiOperation({
    summary: 'Áp dụng template — giao OKR cho nhiều user',
    description:
      'Tạo **UserOkr** và gửi thông báo từng user. User id không tồn tại bị **bỏ qua** (không fail cả lô). **structure** rỗng → 400.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID bản ghi template (**okr_templates.id**).' })
  @ApiBody({ type: ApplyTemplateDto })
  @ApiOkResponse({ type: ApplyTemplateResponseDto })
  @ApiBadRequestResponse({
    description:
      '*Template structure is empty*, *Phải chọn ít nhất 1 người*, hoặc lỗi validation DTO.',
  })
  @ApiNotFoundResponse({ description: 'Template id không tồn tại.' })
  @ApiInternalServerErrorResponse()
  applyTemplate(@Param('id') id: string, @Body() applyDto: ApplyTemplateDto) {
    return this.okrTemplateService.applyTemplate(id, {
      userIds: applyDto.userIds,
      cycleId: applyDto.cycleId,
      deadline: applyDto.deadline ? new Date(applyDto.deadline) : undefined,
    });
  }
}
