import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PermissionLevel } from '../../../database/entities/management-position.entity';

export class CreateManagementPositionDto {
  @ApiProperty({ example: 'Trưởng khoa' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'TRUONG_KHOA',
    description: 'Service chuẩn hóa UPPER, khoảng trắng thành **gạch dưới**, bỏ ký tự không phải A–Z, 0–9, gạch dưới.',
  })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    enum: PermissionLevel,
    default: PermissionLevel.NONE,
  })
  @IsOptional()
  @IsEnum(PermissionLevel)
  permissionLevel?: PermissionLevel;
}

export class UpdateManagementPositionDto extends PartialType(
  CreateManagementPositionDto,
) {}

export class ManagementPositionSwaggerDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Trưởng khoa' })
  name: string;

  @ApiProperty({ example: 'TRUONG_KHOA' })
  slug: string;

  @ApiPropertyOptional({ nullable: true })
  description?: string | null;

  @ApiProperty({ enum: PermissionLevel })
  permissionLevel: PermissionLevel;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

export class RemoveManagementPositionResponseDto {
  @ApiProperty({ example: 'Đã xóa chức vụ "Trưởng khoa"' })
  message: string;
}
