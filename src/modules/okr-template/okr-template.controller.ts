import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { OkrTemplateService } from './okr-template.service';

@Controller('okr-templates')
export class OkrTemplateController {
  constructor(private readonly okrTemplateService: OkrTemplateService) {}

  @Get()
  findAll(@Query('departmentId') departmentId?: string) {
    if (departmentId) {
      return this.okrTemplateService.findByDepartment(departmentId);
    }
    return this.okrTemplateService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.okrTemplateService.findOne(id);
  }

  @Post()
  create(@Body() createDto: any) {
    return this.okrTemplateService.create(createDto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.okrTemplateService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.okrTemplateService.remove(id);
  }

  @Post(':id/apply')
  applyTemplate(
    @Param('id') id: string,
    @Body() applyDto: { userId: string; cycleId: string; deadline?: Date },
  ) {
    return this.okrTemplateService.applyTemplate(id, applyDto);
  }
}
