import { Controller, Post, Get, Body, Put, Param } from '@nestjs/common';
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
      'Public (chưa gắn guard). `EvaluationCycle` sort `createdAt DESC`. Dùng cho portal và user xem kỳ.',
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
      'Kỳ mới luôn `status: CLOSED` sau khi tạo; mở bằng `PUT .../status`. **Lưu ý:** controller chưa bật JWT/guard — nên bảo vệ ở production.\n\n' +
      'Ràng buộc service: `startDate` ≥ hôm nay (00:00); `endDate` > `startDate`.',
  })
  @ApiBody({ type: CreateCycleDto })
  @ApiOkResponse({
    description: 'Bản ghi kỳ vừa tạo (`status: CLOSED`)',
    type: EvaluationCycleSwaggerDto,
  })
  @ApiBadRequestResponse({
    description:
      'Ngày bắt đầu quá khứ; hoặc `endDate` không sau `startDate`; hoặc validation DTO (`IsDateString`, `IsEnum`, …).',
  })
  @ApiInternalServerErrorResponse({ description: 'Lỗi khi `save()` (DB).' })
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
      'Trả về `{ message, cycle, isPast }`. `isPast`: kỳ đã qua `endDate` so với hôm nay.\n\n' +
      '**Lưu ý:** chưa có guard trên controller.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: '`evaluation_cycles.id`.' })
  @ApiBody({ type: ToggleCycleStatusDto })
  @ApiOkResponse({
    description: 'Kết quả cập nhật + bản ghi kỳ',
    type: ToggleCycleStatusResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Body không hợp lệ (validation enum `status`).' })
  @ApiNotFoundResponse({ description: '`Không tìm thấy kỳ đánh giá`.' })
  @ApiInternalServerErrorResponse()
  async toggleCycleStatus(@Param('id') id: string, @Body() body: ToggleCycleStatusDto) {
    return this.performanceService.toggleCycleStatus(id, body.status);
  }
}
