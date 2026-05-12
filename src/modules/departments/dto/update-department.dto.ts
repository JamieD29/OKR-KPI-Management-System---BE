import { PartialType } from '@nestjs/swagger';
import { CreateDepartmentDto } from './create-department.dto';

/** PATCH: mọi field optional (giữ validation khi field được gửi). */
export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {}
