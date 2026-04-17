import { UserStatus } from '@prisma/client';

export { UserStatus };

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}
