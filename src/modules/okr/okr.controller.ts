import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { OkrService } from './okr.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // 👈 Check lại đường dẫn guard của mày

@Controller('okrs') // 👈 Khai báo cái cửa "okrs"
@UseGuards(JwtAuthGuard) // Nhớ bảo vệ, có token mới được gọi
export class OkrController {
  constructor(private readonly okrService: OkrService) {}

  @Post('department') // Tạo thành đường dẫn: POST /okrs/department
  async createDepartmentOkr(@Body() body: any) {
    console.log('📥 Nhận được Data OKR từ Frontend:', body);
    return this.okrService.createDepartmentOkr(body);
  }

  @Get('department') // Tạo thành đường dẫn: GET /okrs/department
  async getDepartmentOkrs() {
    return this.okrService.getDepartmentOkrs();
  }
}
