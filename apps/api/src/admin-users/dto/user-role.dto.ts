import { IsString, IsNotEmpty } from 'class-validator';

/**
 * 관리자에게 역할을 할당할 때 사용하는 DTO.
 */
export class AssignRoleDto {
  @IsString()
  @IsNotEmpty()
  roleId: string;
}
