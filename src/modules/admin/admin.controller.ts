import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

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
}