import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// Định nghĩa dữ liệu cho 1 dòng KPI
export class KpiItemDto {
  @IsOptional()
  @IsString()
  templateId?: string; // Nếu là dòng có sẵn thì gửi ID này

  @IsNotEmpty()
  @IsString()
  content: string; // Tên tiêu chí

  @IsNotEmpty()
  @IsString()
  categoryId: string; // Thuộc nhóm A hay B

  @IsNumber()
  quantity: number; // Số lượng nhập vào (VD: 100 tiết)

  @IsOptional()
  @IsString()
  evidenceUrl?: string; // Link minh chứng (Google Drive/Upload)
}

// Định nghĩa cục dữ liệu gửi lên (Gửi 1 mảng các dòng)
export class CreateUserKpiDto {
  @IsNotEmpty()
  @IsString()
  cycleId: string; // Gửi cho học kỳ nào

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => KpiItemDto)
  items: KpiItemDto[]; // Danh sách các dòng KPI
}
