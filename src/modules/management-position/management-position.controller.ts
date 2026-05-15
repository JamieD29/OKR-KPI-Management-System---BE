import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
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
import { ManagementPositionService } from './management-position.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/role.decorator';
import { RoleType } from '../../common/enums/role.enum';
import {
  CreateManagementPositionDto,
  UpdateManagementPositionDto,
  ManagementPositionSwaggerDto,
  RemoveManagementPositionResponseDto,
} from './dto/management-position.dto';

@ApiTags('management-positions')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description:
    'Thiếu header **Authorization** dạng **Bearer** kèm token, hoặc JWT không hợp lệ / hết hạn.',
})
@Controller('management-positions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ManagementPositionController {
  constructor(private readonly positionService: ManagementPositionService) {}

  @Get()
  @ApiOperation({
    summary: 'Danh sách chức vụ quản lý',
    description: 'Mọi user đã đăng nhập. Sắp **createdAt** tăng dần.',
  })
  @ApiOkResponse({
    type: ManagementPositionSwaggerDto,
    isArray: true,
  })
  @ApiInternalServerErrorResponse()
  findAll() {
    return this.positionService.findAll();
  }

  @Post()
  @Roles(RoleType.ADMIN)
  @ApiOperation({
    summary: 'Tạo chức vụ (ADMIN)',
    description: 'Slug được chuẩn hóa và kiểm tra unique.',
  })
  @ApiBody({ type: CreateManagementPositionDto })
  @ApiOkResponse({ type: ManagementPositionSwaggerDto })
  @ApiBadRequestResponse({ description: 'Validation DTO.' })
  @ApiForbiddenResponse({ description: 'Không có role ADMIN.' })
  @ApiConflictResponse({
    description: '*Chức vụ với slug "..." đã tồn tại*.',
  })
  @ApiInternalServerErrorResponse()
  create(@Body() body: CreateManagementPositionDto) {
    return this.positionService.create(body);
  }

  @Patch(':id')
  @Roles(RoleType.ADMIN)
  @ApiOperation({
    summary: 'Cập nhật chức vụ (ADMIN)',
    description: 'Nếu đổi **slug**: chuẩn hóa và kiểm tra trùng (trừ chính bản ghi).',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: UpdateManagementPositionDto })
  @ApiOkResponse({ type: ManagementPositionSwaggerDto })
  @ApiForbiddenResponse({ description: 'Không có role ADMIN.' })
  @ApiNotFoundResponse({
    description: '*Chức vụ với ID … không tồn tại*.',
  })
  @ApiConflictResponse({
    description: 'Slug trùng bản ghi khác.',
  })
  @ApiInternalServerErrorResponse()
  update(@Param('id') id: string, @Body() body: UpdateManagementPositionDto) {
    return this.positionService.update(id, body);
  }

  @Delete(':id')
  @Roles(RoleType.ADMIN)
  @ApiOperation({
    summary: 'Xóa chức vụ (ADMIN)',
    description:
      '**409** nếu đang có **EvaluationCycle** với trạng thái **OPEN**.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: RemoveManagementPositionResponseDto })
  @ApiForbiddenResponse({ description: 'Không có role ADMIN.' })
  @ApiNotFoundResponse({
    description: '*Chức vụ với ID … không tồn tại*.',
  })
  @ApiConflictResponse({
    description:
      '*Không thể xóa chức vụ quản lý trong quá trình đánh giá (có kỳ đánh giá đang mở).*',
  })
  @ApiInternalServerErrorResponse()
  remove(@Param('id') id: string) {
    return this.positionService.remove(id);
  }
}
