import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty } from 'class-validator';
import { RoleType } from '../../../common/enums/role.enum';

export class UpdateUserRolesDto {
  @ApiProperty({
    enum: RoleType,
    isArray: true,
    example: [RoleType.USER, RoleType.ADMIN],
    description: 'Danh sách slug role (chuẩn hóa in hoa trong service).',
  })
  @IsArray()
  @IsNotEmpty()
  @IsEnum(RoleType, { each: true, message: 'Role không hợp lệ' })
  roles: RoleType[];
}
