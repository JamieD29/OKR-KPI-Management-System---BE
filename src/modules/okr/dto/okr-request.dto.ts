import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class CreateDepartmentOkrDto {
  @ApiProperty({ example: 'Nâng cao chất lượng đào tạo' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'DEPARTMENT', description: 'Loại OKR (vd `DEPARTMENT`).' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ format: 'uuid', description: '`evaluation_cycles.id`.' })
  @IsUUID('4')
  cycleId: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  departmentId?: string;

  @ApiProperty({
    type: 'array',
    description: 'Danh sách Key Result (JSON / partial entity); cascade lưu theo `Objective`.',
    items: { type: 'object', additionalProperties: true },
  })
  @IsArray()
  keyResults: Record<string, unknown>[];
}

export class OkrChatBodyDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  itemId: string;

  @ApiProperty({ example: 'Đề nghị điều chỉnh trọng số mục A.' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({
    enum: ['USER', 'MANAGER'],
    default: 'USER',
    description: 'Mặc định `USER` nếu bỏ qua.',
  })
  @IsOptional()
  @IsIn(['USER', 'MANAGER'])
  sender?: 'USER' | 'MANAGER';
}

export class ItemScoreUpdatesDto {
  @ApiPropertyOptional({ description: 'Cập nhật `maxScore` trên node `itemId`.' })
  @IsOptional()
  @IsNumber()
  maxScore?: number;

  @ApiPropertyOptional({ description: 'Cập nhật `unitScore`.' })
  @IsOptional()
  @IsNumber()
  unitScore?: number;
}

export class EditItemBodyDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  itemId: string;

  @ApiProperty({ type: ItemScoreUpdatesDto })
  @ValidateNested()
  @Type(() => ItemScoreUpdatesDto)
  updates: ItemScoreUpdatesDto;
}

export class RejectOkrDto {
  @ApiPropertyOptional({
    description: 'Mặc định trong controller: `Không có lý do` nếu không gửi.',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class SelfReportBodyDto {
  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description:
      'Map khóa `${objectiveId}-${itemId}` (và cấp con nếu có) → `{ quantity, evidence?, ... }`.',
  })
  @IsObject()
  selfReportData: Record<string, unknown>;
}

export class ManagerReviewOkrBodyDto {
  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description: 'Cùng cấu trúc map số lượng như `selfReportData` (điểm cấp quản lý).',
  })
  @IsObject()
  managerReportData: Record<string, unknown>;
}

export class SubmitEvaluationFormDto {
  @ApiPropertyOptional({ description: 'Phần tự nhận xét.' })
  @IsOptional()
  @IsString()
  selfComment?: string;

  @ApiPropertyOptional({
    example: 'EXCELLENT',
    description: 'Xếp loại phía user (vd EXCELLENT, GOOD, POOR).',
  })
  @IsOptional()
  @IsString()
  selfRating?: string;
}

export class ManagerReviewEvaluationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  managerComment?: string;

  @ApiPropertyOptional({ example: 'GOOD' })
  @IsOptional()
  @IsString()
  managerRating?: string;
}
