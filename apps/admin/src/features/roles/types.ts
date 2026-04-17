/**
 * roles 도메인 타입 정의.
 */
export interface RoleMenuEntry {
  menuId: string;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { userRoles: number };
  roleMenus?: RoleMenuEntry[];
}

export interface RoleMenuPermission {
  menuId: string;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
}

export interface CreateRoleInput {
  name: string;
  description?: string;
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
}

export interface RoleUser {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  status: string;
  assignedAt: string;
}
