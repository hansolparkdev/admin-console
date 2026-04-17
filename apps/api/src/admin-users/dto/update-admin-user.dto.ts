import { IsEnum, IsOptional } from 'class-validator';
import { UserStatus } from '@prisma/client';

export enum AdminUserAction {
  approve = 'approve',
  reject = 'reject',
  restore_pending = 'restore_pending',
  restore_active = 'restore_active',
}

export class UpdateAdminUserDto {
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsEnum(AdminUserAction)
  action?: AdminUserAction;
}
