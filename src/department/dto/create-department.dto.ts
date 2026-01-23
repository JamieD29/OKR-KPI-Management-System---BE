export class CreateDepartmentDto {
  name: string;
  parent_id?: number | null;
  manager_id?: number | null;
}
