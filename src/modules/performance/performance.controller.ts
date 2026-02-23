import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Put,
  Param,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { PerformanceService } from './performance.service';
import { CreateUserKpiDto } from './dto/create-user-kpi.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // 👈 Đảm bảo đường dẫn này đúng tới file guard của mày

@Controller('performance')
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  // API này để chạy tool tạo dữ liệu mẫu
  @Post('init')
  async initData() {
    return this.performanceService.initMockData();
  }

  // 👇 ĐÃ SỬA: Lắp Guard và lấy ID từ Token, bắt lỗi chuẩn 400
  @Post('kpi/submit')
  @UseGuards(JwtAuthGuard)
  async submitKpi(@Req() req: any, @Body() body: any) {
    console.log('📥 DỮ LIỆU NHẬN ĐƯỢC TỪ CLIENT:', body);

    // 1. Lấy userId trực tiếp từ Token (Bảo mật tuyệt đối)
    const userId = req.user?.id || req.user?.sub;
    if (!userId) {
      throw new BadRequestException('❌ Không xác định được người dùng!');
    }

    // 2. Lấy DTO
    const dto = body.data || body;
    if (!dto.cycleId) {
      throw new BadRequestException(`❌ Thiếu cycleId! (Nhận được: ${JSON.stringify(dto)})`);
    }

    return this.performanceService.submitKpi(userId, dto);
  }

  // 👇 ĐÃ SỬA: NGUYÊN NHÂN GÂY KẸT LOGOUT ĐÃ ĐƯỢC FIX Ở ĐÂY
  @Get('kpi/my-kpi')
  @UseGuards(JwtAuthGuard)
  async getMyKpis(@Req() req: any, @Query('cycleId') cycleId: string) {
    // Moi ID từ túi Token ra
    const userId = req.user?.id || req.user?.sub;

    if (!cycleId) {
      // Dùng BadRequestException để ném lỗi 400 thay vì sập server 500
      throw new BadRequestException('❌ Thiếu cycleId');
    }
    return this.performanceService.getMyKpis(userId, cycleId);
  }

  @Get('template')
  async getTemplate() {
    return this.performanceService.getKpiTemplate();
  }

  @Get('cycles')
  async getCycles() {
    return this.performanceService.getCycles();
  }

  // GET /performance/manager/overview?cycleId=...
  @Get('manager/overview')
  async getDepartmentOverview(@Query('cycleId') cycleId: string) {
    return this.performanceService.getDepartmentOverview(cycleId);
  }

  // POST /performance/manager/review
  @Post('manager/review')
  async reviewKpi(
    @Body() body: { id: string; managerScore: number; status: string; managerComment: string },
  ) {
    return this.performanceService.reviewKpi(
      body.id,
      body.managerScore,
      body.status,
      body.managerComment,
    );
  }

  @Post('admin/cycles')
  async createCycle(@Body() body: { name: string; startDate: string; endDate: string }) {
    return this.performanceService.createCycle(
      body.name,
      new Date(body.startDate),
      new Date(body.endDate),
    );
  }

  @Put('admin/cycles/:id/status')
  async toggleCycleStatus(@Param('id') id: string, @Body() body: { status: string }) {
    console.log(`📡 ADMIN ACTION: Đổi trạng thái kỳ ${id} sang ${body.status}`);
    return this.performanceService.toggleCycleStatus(id, body.status as any);
  }
}
