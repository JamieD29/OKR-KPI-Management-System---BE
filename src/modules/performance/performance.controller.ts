import { Controller, Post, Get, Body, Put, Param, Delete } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBody,
  ApiParam,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { PerformanceService } from './performance.service';
import { CreateCycleDto } from './dto/create-cycle.dto';
import { ToggleCycleStatusDto } from './dto/toggle-cycle-status.dto';
import {
  EvaluationCycleSwaggerDto,
  ToggleCycleStatusResponseDto,
} from './dto/evaluation-cycle-response.dto';

@ApiTags('performance')
@Controller('performance')
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Get('cycles')
  @ApiOperation({
    summary: 'Danh sách kỳ đánh giá',
    description:
      '*Công khai* (chưa gắn guard). Bảng **EvaluationCycle**, sort **createdAt** giảm dần. Dùng cho portal và user xem kỳ.',
  })
  @ApiOkResponse({
    description: 'Mảng kỳ đánh giá',
    type: EvaluationCycleSwaggerDto,
    isArray: true,
  })
  @ApiInternalServerErrorResponse({ description: 'Lỗi DB / TypeORM.' })
  async getCycles() {
    return this.performanceService.getCycles();
  }

  @Post('admin/cycles')
  @ApiOperation({
    summary: 'Tạo kỳ đánh giá (đường dẫn admin)',
    description:
      'Kỳ mới luôn **status** *CLOSED* sau khi tạo; mở kỳ qua **PUT** …/status. **Lưu ý:** controller chưa bật JWT/guard — nên bảo vệ ở production.\n\n' +
      'Ràng buộc service: **startDate** không trước hôm nay (00:00); **endDate** phải sau **startDate**.',
  })
  @ApiBody({ type: CreateCycleDto })
  @ApiOkResponse({
    description: 'Bản ghi kỳ vừa tạo (**status** *CLOSED*)',
    type: EvaluationCycleSwaggerDto,
  })
  @ApiBadRequestResponse({
    description:
      'Ngày bắt đầu quá khứ; hoặc **endDate** không sau **startDate**; hoặc validation DTO (chuỗi ngày, enum, …).',
  })
  @ApiInternalServerErrorResponse({ description: 'Lỗi khi lưu vào DB.' })
  async createCycle(@Body() body: CreateCycleDto) {
    return this.performanceService.createCycle(
      body.name,
      body.type ?? '',
      new Date(body.startDate),
      new Date(body.endDate),
    );
  }

  @Put('admin/cycles/:id/status')
  @ApiOperation({
    summary: 'Đổi trạng thái kỳ đánh giá',
    description:
      'Trả về object có **message**, **cycle**, **isPast**. **isPast** = *true* nếu ngày kết thúc kỳ đã qua so với hôm nay.\n\n' +
      '**Lưu ý:** chưa có guard trên controller.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID bản ghi (**evaluation_cycles.id**).' })
  @ApiBody({ type: ToggleCycleStatusDto })
  @ApiOkResponse({
    description: 'Kết quả cập nhật + bản ghi kỳ',
    type: ToggleCycleStatusResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Body không hợp lệ (validation trường **status**).' })
  @ApiNotFoundResponse({ description: '*Không tìm thấy kỳ đánh giá*.' })
  @ApiInternalServerErrorResponse()
  async toggleCycleStatus(@Param('id') id: string, @Body() body: ToggleCycleStatusDto) {
    return this.performanceService.toggleCycleStatus(id, body.status);
  }

  @Delete('admin/cycles/:id')
  @ApiOperation({
    summary: 'Xóa (soft-delete) kỳ đánh giá',
    description:
      'Đổi trạng thái isDel thành true để ẩn đi trên giao diện. Không thể xóa kỳ đang OPEN.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID của kỳ đánh giá.' })
  @ApiOkResponse({ description: 'Thông báo xóa thành công' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy kỳ đánh giá' })
  @ApiBadRequestResponse({ description: 'Không thể xóa kỳ đang mở' })
  async deleteCycle(@Param('id') id: string) {
    return this.performanceService.deleteCycle(id);
  }
}
