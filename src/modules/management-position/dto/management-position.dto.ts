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
    description: 'Service chuẩn hóa UPPER, space → `_`, bỏ ký tự không phải A-Z0-9_.',
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

  @ApiProperty()
  name: string;

  @ApiProperty()
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
