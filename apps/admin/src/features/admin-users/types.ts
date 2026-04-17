export type AdminUserStatus = "pending" | "active" | "rejected";

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  provider: string;
  status: AdminUserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUsersPage {
  data: AdminUser[];
  total: number;
  page: number;
  limit: number;
}

export interface UserRoleItem {
  roleId: string;
  roleName: string;
  isSystem: boolean;
  assignedAt: string;
}
