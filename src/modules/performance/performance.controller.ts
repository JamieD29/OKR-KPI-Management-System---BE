import {
  Controller,
  Post,
  Get,
  Body,
  Put,
  Param,
} from '@nestjs/common';
import { PerformanceService } from './performance.service';

@Controller('performance')
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  // Lấy danh sách kỳ đánh giá
  @Get('cycles')
  async getCycles() {
    return this.performanceService.getCycles();
  }

  // Tạo kỳ đánh giá mới
  @Post('admin/cycles')
  async createCycle(@Body() body: { name: string; startDate: string; endDate: string }) {
    return this.performanceService.createCycle(
      body.name,
      new Date(body.startDate),
      new Date(body.endDate),
    );
  }

  // Đổi trạng thái kỳ đánh giá
  @Put('admin/cycles/:id/status')
  async toggleCycleStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.performanceService.toggleCycleStatus(id, body.status);
  }
}
