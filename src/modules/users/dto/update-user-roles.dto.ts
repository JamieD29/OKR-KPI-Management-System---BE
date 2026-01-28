import { IsArray, IsEnum, IsNotEmpty } from 'class-validator';
import { RoleType } from '../../../common/enums/role.enum'; // Trỏ đúng đường dẫn file enum mày tạo lúc đầu

export class UpdateUserRolesDto {
  @IsArray()
  @IsNotEmpty()
  @IsEnum(RoleType, { each: true, message: 'Role không hợp lệ' })
  roles: RoleType[];
}
