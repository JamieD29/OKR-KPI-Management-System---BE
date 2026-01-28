import { IsEmail, IsNotEmpty, IsOptional, IsString, IsArray, IsEnum } from 'class-validator';
import { RoleType } from '../../../common/enums/role.enum'; // Nhớ import đúng đường dẫn enum

export class CreateUserDto {
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Tên không được để trống' })
  name: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  // Trường này tùy chọn, nếu Admin tạo thì có thể set luôn Role
  // Nếu user tự login Google thì code sẽ tự gán default là USER
  @IsOptional()
  @IsArray()
  @IsEnum(RoleType, { each: true, message: 'Role không hợp lệ' })
  roles?: RoleType[];

  // Nếu mày có lưu department ngay lúc tạo thì thêm vào
  @IsOptional()
  @IsString()
  departmentId?: string;
}
