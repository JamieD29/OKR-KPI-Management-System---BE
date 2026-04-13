import { Controller, Post, Get, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { OkrService } from './okr.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('okrs')
@UseGuards(JwtAuthGuard)
export class OkrController {
  constructor(private readonly okrService: OkrService) {}

  @Post('department')
  async createDepartmentOkr(@Body() body: any) {
    return this.okrService.createDepartmentOkr(body);
  }

  @Get('department')
  async getDepartmentOkrs() {
    return this.okrService.getDepartmentOkrs();
  }

  // --- OKR NEGOTIATION ---

  @Get('my')
  async getMyOkrs(@Request() req: any) {
    return this.okrService.getMyOkrs(req.user.id || req.user.sub);
  }

  @Get('pending-approval')
  async getPendingApproval() {
    return this.okrService.getPendingApproval();
  }

  @Put(':id/accept')
  async acceptOkr(@Param('id') id: string, @Request() req: any) {
    return this.okrService.acceptOkr(id, req.user.id || req.user.sub);
  }

  @Put(':id/negotiate')
  async negotiateOkr(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.okrService.negotiateOkr(id, req.user.id || req.user.sub, body.proposedChanges);
  }

  @Put(':id/dean-approve')
  async approveOkr(@Param('id') id: string) {
    return this.okrService.approveOkr(id);
  }

  @Put(':id/dean-reject')
  async rejectOkr(@Param('id') id: string, @Body('reason') reason: string) {
    return this.okrService.rejectOkr(id, reason || 'Không có lý do');
  }

  // --- SELF-REPORT ---

  @Put(':id/self-report')
  async submitSelfReport(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.okrService.submitSelfReport(id, req.user.id || req.user.sub, body.selfReportData);
  }

  // --- DEAN REVIEW SUBMITTED ---

  @Get('submitted')
  async getSubmittedOkrs() {
    return this.okrService.getSubmittedOkrs();
  }

  @Put(':id/review')
  async reviewOkr(@Param('id') id: string, @Body() body: any) {
    return this.okrService.reviewOkr(id, body);
  }

  // --- REAL EVALUATION ENDPOINTS ---

  @Post('evaluations/sync')
  async syncDummyEvaluations() {
    return this.okrService.syncDummyEvaluations();
  }

  @Get('evaluations/submitted')
  async getSubmittedEvaluations() {
    return this.okrService.getSubmittedEvaluations();
  }

  @Put('evaluations/bulk-review')
  async bulkReviewEvaluations(@Body() body: any) {
    return this.okrService.bulkSaveEvaluations(body.updates);
  }

  @Put('evaluations/:id/review')
  async reviewEvaluation(@Param('id') id: string, @Body() body: any) {
    return this.okrService.saveEvaluation(id, body);
  }
}
