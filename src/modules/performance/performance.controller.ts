import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { PerformanceService } from './performance.service';
import { Put, Param } from '@nestjs/common';
import { CreateUserKpiDto } from './dto/create-user-kpi.dto'; // Import DTO

@Controller('performance')
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  // API này để chạy tool tạo dữ liệu mẫu (Chạy 1 lần là có data test ngay)
  // POST: http://localhost:3000/performance/init
  @Post('init')
  async initData() {
    return this.performanceService.initMockData();
  }

  // API lấy template để hiển thị lên màn hình đánh giá
  // GET: http://localhost:3000/performance/template
  @Post('kpi/submit')
  async submitKpi(@Body() body: any) {
    console.log('📥 DỮ LIỆU NHẬN ĐƯỢC TỪ CLIENT:', body); // Debug xem gửi cái gì lên

    // 1. Lấy userId
    const userId = body.userId;
    if (!userId) {
      throw new Error('❌ Thiếu userId trong body!');
    }

    // 2. Lấy DTO (Chấp nhận cả 2 kiểu gửi: nằm trong 'data' hoặc nằm ngay bên ngoài)
    // Nếu body.data có thì dùng, nếu không thì dùng chính body
    const dto = body.data || body;

    // Check kỹ xem có cycleId chưa
    if (!dto.cycleId) {
      throw new Error(`❌ Thiếu cycleId! (Nhận được: ${JSON.stringify(dto)})`);
    }

    return this.performanceService.submitKpi(userId, dto);
  }

  @Get('kpi/my-kpi')
  async getMyKpis(@Query('userId') userId: string, @Query('cycleId') cycleId: string) {
    if (!userId || !cycleId) {
      throw new Error('❌ Thiếu userId hoặc cycleId');
    }
    return this.performanceService.getMyKpis(userId, cycleId);
  }

  @Get('template')
  async getTemplate() {
    return this.performanceService.getKpiTemplate();
  }

  // API lấy danh sách học kỳ
  @Get('cycles')
  async getCycles() {
    return this.performanceService.getCycles();
  }

  // 1. API Lấy danh sách nhân viên đã nộp (Cho Manager xem)
  // GET /performance/manager/overview?cycleId=...
  @Get('manager/overview')
  async getDepartmentOverview(@Query('cycleId') cycleId: string) {
    return this.performanceService.getDepartmentOverview(cycleId);
  }

  // 2. API Duyệt từng dòng KPI
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

  // API Tạo kỳ mới
  @Post('admin/cycles')
  async createCycle(@Body() body: { name: string; startDate: string; endDate: string }) {
    return this.performanceService.createCycle(
      body.name,
      new Date(body.startDate),
      new Date(body.endDate),
    );
  }

  // 👇 API Đóng/Mở kỳ đánh giá (Sửa lại để gọi Service thật)
  @Put('admin/cycles/:id/status')
  async toggleCycleStatus(@Param('id') id: string, @Body() body: { status: string }) {
    console.log(`📡 ADMIN ACTION: Đổi trạng thái kỳ ${id} sang ${body.status}`);

    // Gọi sang Service để update Database
    return this.performanceService.toggleCycleStatus(id, body.status as any);
  }
}
