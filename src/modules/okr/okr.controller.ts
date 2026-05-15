import { Controller, Post, Get, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { OkrService } from './okr.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateDepartmentOkrDto,
  OkrChatBodyDto,
  EditItemBodyDto,
  RejectOkrDto,
  SelfReportBodyDto,
  ManagerReviewOkrBodyDto,
  SubmitEvaluationFormDto,
  ManagerReviewEvaluationDto,
} from './dto/okr-request.dto';
import {
  ObjectiveSwaggerDto,
  UserOkrSwaggerDto,
  UserEvaluationSwaggerDto,
  MyEvaluationFormResponseDto,
} from './dto/okr-response.dto';

@ApiTags('okrs')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description:
    'Thiếu header **Authorization** dạng **Bearer** kèm token, hoặc JWT không hợp lệ / hết hạn.',
})
@Controller('okrs')
@UseGuards(JwtAuthGuard)
export class OkrController {
  constructor(private readonly okrService: OkrService) {}

  @Post('department')
  @ApiOperation({
    summary: 'Tạo OKR cấp bộ môn (legacy Objective)',
    description:
      'Bản **Objective** loại **DEPARTMENT**, **status** và **progress** mặc định trong service. Lỗi DB → 500.',
  })
  @ApiBody({ type: CreateDepartmentOkrDto })
  @ApiOkResponse({ description: 'Objective đã lưu', type: ObjectiveSwaggerDto })
  @ApiBadRequestResponse({ description: 'Validation DTO.' })
  @ApiInternalServerErrorResponse({
    description: 'Lỗi khi lưu (thao tác **createDepartmentOkr**).',
  })
  async createDepartmentOkr(@Body() body: CreateDepartmentOkrDto) {
    return this.okrService.createDepartmentOkr(body);
  }

  @Get('department')
  @ApiOperation({
    summary: 'Danh sách OKR bộ môn',
    description: '**type** DEPARTMENT, kèm **keyResults**, sort **createdAt** giảm dần.',
  })
  @ApiOkResponse({
    description: 'Mảng Objective',
    type: ObjectiveSwaggerDto,
    isArray: true,
  })
  @ApiInternalServerErrorResponse()
  async getDepartmentOkrs() {
    return this.okrService.getDepartmentOkrs();
  }

  // --- OKR NEGOTIATION ---

  @Get('my')
  @ApiOperation({
    summary: 'OKR được giao cho tôi',
    description: '**userId** lấy từ JWT (claim **id** hoặc **sub**).',
  })
  @ApiOkResponse({
    type: UserOkrSwaggerDto,
    isArray: true,
  })
  @ApiInternalServerErrorResponse()
  async getMyOkrs(@Request() req: any) {
    return this.okrService.getMyOkrs(req.user.id || req.user.sub);
  }

  @Get('pending-approval')
  @ApiOperation({
    summary: 'OKR đang đàm phán (NEGOTIATING)',
    description:
      'Dành cho quy trình duyệt; kèm quan hệ **user**, department, managementPosition.',
  })
  @ApiOkResponse({
    type: UserOkrSwaggerDto,
    isArray: true,
  })
  @ApiInternalServerErrorResponse()
  async getPendingApproval() {
    return this.okrService.getPendingApproval();
  }

  @Put(':id/accept')
  @ApiOperation({
    summary: 'User chấp nhận OKR được giao',
    description:
      'Chỉ bản ghi khớp **id** và **userId** trong JWT; **status** chuyển sang *ACCEPTED*.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: UserOkrSwaggerDto })
  @ApiNotFoundResponse({ description: '*OKR not found*.' })
  @ApiInternalServerErrorResponse()
  async acceptOkr(@Param('id') id: string, @Request() req: any) {
    return this.okrService.acceptOkr(id, req.user.id || req.user.sub);
  }

  @Post(':id/chat')
  @ApiOperation({
    summary: 'Trao đổi / chat trên một mục OKR',
    description:
      'Append vào **proposedChanges** theo **itemId**. Người gửi **USER** → status *NEGOTIATING*; **MANAGER** → *PENDING*.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID bản ghi **user_okrs**.' })
  @ApiBody({ type: OkrChatBodyDto })
  @ApiOkResponse({ type: UserOkrSwaggerDto })
  @ApiBadRequestResponse({ description: 'Validation body.' })
  @ApiNotFoundResponse({ description: '*OKR not found*.' })
  @ApiInternalServerErrorResponse()
  async chatItem(@Param('id') id: string, @Body() body: OkrChatBodyDto) {
    const sender = body.sender || 'USER';
    return this.okrService.chatItem(id, body.itemId, sender, body.message);
  }

  @Put(':id/edit-item')
  @ApiOperation({
    summary: 'Cập nhật maxScore / unitScore trên node trong cây keyResults',
    description: 'Tìm đệ quy theo **itemId** trong JSON.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: EditItemBodyDto })
  @ApiOkResponse({ type: UserOkrSwaggerDto })
  @ApiBadRequestResponse({ description: 'Validation body.' })
  @ApiNotFoundResponse({ description: '*OKR not found*.' })
  @ApiInternalServerErrorResponse()
  async editItemProperties(@Param('id') id: string, @Body() body: EditItemBodyDto) {
    return this.okrService.updateItemProperties(id, body.itemId, body.updates);
  }

  @Put(':id/dean-approve')
  @ApiOperation({
    summary: 'Duyệt đề xuất OKR (trưởng khoa)',
    description:
      '**status** chuyển sang *ACCEPTED*, gửi thông báo cho user.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: UserOkrSwaggerDto })
  @ApiNotFoundResponse({ description: '*OKR not found*.' })
  @ApiInternalServerErrorResponse()
  async approveOkr(@Param('id') id: string) {
    return this.okrService.approveOkr(id);
  }

  @Put(':id/dean-reject')
  @ApiOperation({
    summary: 'Từ chối đề xuất OKR',
    description:
      '**status** chuyển *PENDING*, xóa **proposedChanges**, thông báo kèm **reason**.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: RejectOkrDto })
  @ApiOkResponse({ type: UserOkrSwaggerDto })
  @ApiNotFoundResponse({ description: '*OKR not found*.' })
  @ApiInternalServerErrorResponse()
  async rejectOkr(@Param('id') id: string, @Body() body: RejectOkrDto) {
    return this.okrService.rejectOkr(id, body.reason?.trim() || 'Không có lý do');
  }

  // --- SELF-REPORT ---

  @Put(':id/self-report')
  @ApiOperation({
    summary: 'Nộp tự khai điểm',
    description:
      'Yêu cầu **status** đang *ACCEPTED*. Cập nhật **selfReportData**, **totalScore**, **status** → *SUBMITTED*.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: SelfReportBodyDto })
  @ApiOkResponse({ type: UserOkrSwaggerDto })
  @ApiBadRequestResponse({
    description:
      '*OKR chưa được chấp nhận, không thể tự khai.*',
  })
  @ApiNotFoundResponse({ description: '*OKR not found*.' })
  @ApiInternalServerErrorResponse()
  async submitSelfReport(
    @Param('id') id: string,
    @Body() body: SelfReportBodyDto,
    @Request() req: any,
  ) {
    return this.okrService.submitSelfReport(
      id,
      req.user.id || req.user.sub,
      body.selfReportData,
    );
  }

  // --- DEAN REVIEW SUBMITTED ---

  @Get('submitted')
  @ApiOperation({
    summary: 'OKR đã nộp tự khai (SUBMITTED)',
    description: 'Quản lý xem danh sách chờ duyệt điểm.',
  })
  @ApiOkResponse({ type: UserOkrSwaggerDto, isArray: true })
  @ApiInternalServerErrorResponse()
  async getSubmittedOkrs() {
    return this.okrService.getSubmittedOkrs('SUBMITTED');
  }

  @Get('completed')
  @ApiOperation({
    summary: 'OKR đã chốt điểm (COMPLETED)',
    description: 'Cùng logic danh sách đã nộp với **status** *COMPLETED*.',
  })
  @ApiOkResponse({ type: UserOkrSwaggerDto, isArray: true })
  @ApiInternalServerErrorResponse()
  async getCompletedOkrs() {
    return this.okrService.getSubmittedOkrs('COMPLETED');
  }

  @Put(':id/manager-review')
  @ApiOperation({
    summary: 'Trưởng khoa chấm / duyệt bài tự khai',
    description:
      'Lưu **managerReportData**, **managerScore**, **status** → *COMPLETED*, đồng bộ phiếu đánh giá và thông báo.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: ManagerReviewOkrBodyDto })
  @ApiOkResponse({ type: UserOkrSwaggerDto })
  @ApiNotFoundResponse({ description: '*OKR not found*.' })
  @ApiInternalServerErrorResponse()
  async managerReviewOkr(@Param('id') id: string, @Body() body: ManagerReviewOkrBodyDto) {
    return this.okrService.managerReviewOkr(id, body.managerReportData);
  }

  // ==========================================
  // --- EVALUATION FORM CONTROLLERS ---
  // ==========================================

  @Get('evaluations/my')
  @ApiOperation({
    summary: 'Phiếu đánh giá của tôi (GET + upsert nhẹ)',
    description:
      'Đồng bộ **evaluationData** từ OKR tốt nhất của user; trả thêm **okrObjectiveName**, **okrStatus**.',
  })
  @ApiOkResponse({ type: MyEvaluationFormResponseDto })
  @ApiInternalServerErrorResponse()
  async getMyEvaluationForm(@Request() req) {
    return this.okrService.getMyEvaluationForm(req.user.id);
  }

  @Post('evaluations/my/submit')
  @ApiOperation({
    summary: 'Nộp phiếu tự đánh giá (comment / rating)',
    description:
      '**status** chuyển *SUBMITTED* trên bản **user_evaluations**.',
  })
  @ApiBody({ type: SubmitEvaluationFormDto })
  @ApiOkResponse({ type: UserEvaluationSwaggerDto })
  @ApiNotFoundResponse({ description: '*Evaluation Form not found*.' })
  @ApiInternalServerErrorResponse()
  async submitMyEvaluationForm(@Request() req, @Body() body: SubmitEvaluationFormDto) {
    return this.okrService.submitMyEvaluationForm(req.user.id, body);
  }

  @Get('evaluations/submitted')
  @ApiOperation({
    summary: 'Danh sách phiếu đánh giá (mọi trạng thái trong DB)',
    description:
      '**Lưu ý:** không lọc chỉ trạng thái *SUBMITTED* — service trả toàn bộ bản ghi, sort **updatedAt** giảm dần.',
  })
  @ApiOkResponse({ type: UserEvaluationSwaggerDto, isArray: true })
  @ApiInternalServerErrorResponse()
  async getSubmittedEvaluations() {
    return this.okrService.getSubmittedEvaluations();
  }

  @Put('evaluations/:id/review')
  @ApiOperation({
    summary: 'Cấp quản lý đánh giá phiếu',
    description:
      '**status** chuyển *EVALUATED*, cập nhật **managerComment**, **managerRating**.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID bản **user_evaluations**.' })
  @ApiBody({ type: ManagerReviewEvaluationDto })
  @ApiOkResponse({ type: UserEvaluationSwaggerDto })
  @ApiNotFoundResponse({ description: '*Evaluation form not found*.' })
  @ApiInternalServerErrorResponse()
  async managerReviewEvaluation(
    @Param('id') id: string,
    @Body() body: ManagerReviewEvaluationDto,
  ) {
    return this.okrService.managerReviewEvaluation(id, body);
  }
}
