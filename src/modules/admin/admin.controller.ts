import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { AdminService } from './admin.service';
import { DatabaseSeederService } from '../../database/database-seeder.service';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly seederService: DatabaseSeederService,
  ) {}

  @Get('domains')
  getAllDomains() {
    return this.adminService.findAll();
  }

  @Post('domains')
  addDomain(@Body('domain') domain: string) {
    return this.adminService.create(domain);
  }

  @Delete('domains/:id')
  deleteDomain(@Param('id') id: string) {
    return this.adminService.remove(id);
  }

  // Khôi phục cài đặt gốc toàn hệ thống
  @Post('system/reset')
  async factoryReset() {
    await this.seederService.factoryReset();
    return { message: 'Hệ thống đã được khôi phục về cài đặt gốc thành công!' };
  }
}
