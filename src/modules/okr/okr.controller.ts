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

  @Post(':id/chat')
  async chatItem(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    // Body should contain { itemId: string, message: string, sender?: 'USER' | 'MANAGER' }
    // Note: in a real app we might determine sender from role, but here we can pass it or infer it
    const sender = body.sender || 'USER'; 
    return this.okrService.chatItem(id, body.itemId, sender, body.message);
  }

  @Put(':id/edit-item')
  async editItemProperties(@Param('id') id: string, @Body() body: any) {
    // Body: { itemId: string, updates: { maxScore?: number, unitScore?: number } }
    return this.okrService.updateItemProperties(id, body.itemId, body.updates);
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
    return this.okrService.getSubmittedOkrs('SUBMITTED');
  }

  @Get('completed')
  async getCompletedOkrs() {
    return this.okrService.getSubmittedOkrs('COMPLETED');
  }

  @Put(':id/manager-review')
  async managerReviewOkr(@Param('id') id: string, @Body() body: any) {
    return this.okrService.managerReviewOkr(id, body.managerReportData);
  }

  // ==========================================
  // --- EVALUATION FORM CONTROLLERS ---
  // ==========================================

  @Get('evaluations/my')
  async getMyEvaluationForm(@Request() req) {
    return this.okrService.getMyEvaluationForm(req.user.id);
  }

  @Post('evaluations/my/submit')
  async submitMyEvaluationForm(@Request() req, @Body() body: any) {
    return this.okrService.submitMyEvaluationForm(req.user.id, body);
  }

  @Get('evaluations/submitted')
  async getSubmittedEvaluations() {
    return this.okrService.getSubmittedEvaluations();
  }

  @Put('evaluations/:id/review')
  async managerReviewEvaluation(@Param('id') id: string, @Body() body: any) {
    return this.okrService.managerReviewEvaluation(id, body);
  }
}
