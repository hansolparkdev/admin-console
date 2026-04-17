import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class MenuPermissionDto {
  @IsString()
  @IsNotEmpty()
  menuId: string;

  @IsBoolean()
  canRead: boolean;

  @IsBoolean()
  canWrite: boolean;

  @IsBoolean()
  canDelete: boolean;
}

export class RoleMenuPermissionDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuPermissionDto)
  permissions: MenuPermissionDto[];
}
