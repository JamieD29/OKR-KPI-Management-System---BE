import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
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

@ApiTags('okr-templates')
@Controller('okr-templates')
export class OkrTemplateController {
  constructor(private readonly okrTemplateService: OkrTemplateService) {}

  @Get()
  @ApiOperation({
    summary: 'Danh sách template OKR',
    description:
      'Không có guard. Tham số **departmentId** tùy chọn: lọc theo bộ môn; bỏ qua → toàn bộ, sort **createdAt** giảm dần.',
  })
  @ApiQuery({
    name: 'departmentId',
    required: false,
    format: 'uuid',
    description: 'Lọc theo cột **department_id** của bảng template.',
  })
  @ApiOkResponse({ type: OkrTemplateSwaggerDto, isArray: true })
  @ApiInternalServerErrorResponse()
  findAll(@Query('departmentId') departmentId?: string) {
    if (departmentId) {
      return this.okrTemplateService.findByDepartment(departmentId);
    }
    return this.okrTemplateService.findAll();
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
      '**Công khai** trong code hiện tại — nên bảo vệ ở production. Nếu **structure** không rỗng: tổng **maxScore** ở cấp gốc phải = 100.',
  })
  @ApiBody({ type: CreateOkrTemplateDto })
  @ApiOkResponse({ type: OkrTemplateSwaggerDto })
  @ApiBadRequestResponse({
    description: 'Validation DTO hoặc tổng **maxScore** khác 100.',
  })
  @ApiInternalServerErrorResponse()
  create(@Body() createDto: CreateOkrTemplateDto) {
    return this.okrTemplateService.create(createDto);
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
  update(@Param('id') id: string, @Body() updateDto: UpdateOkrTemplateDto) {
    return this.okrTemplateService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa template' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: RemoveOkrTemplateResponseDto })
  @ApiNotFoundResponse({ description: 'Template không tồn tại.' })
  @ApiInternalServerErrorResponse()
  remove(@Param('id') id: string) {
    return this.okrTemplateService.remove(id);
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
