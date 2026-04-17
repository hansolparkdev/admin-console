import { apiFetch } from "@/lib/api";
import type {
  Role,
  CreateRoleInput,
  UpdateRoleInput,
  RoleMenuPermission,
  RoleUser,
} from "./types";

export async function fetchRoles(): Promise<Role[]> {
  return apiFetch<Role[]>("/roles");
}

export async function fetchRole(id: string): Promise<Role> {
  return apiFetch<Role>(`/roles/${id}`);
}

export async function createRole(input: CreateRoleInput): Promise<Role> {
  return apiFetch<Role>("/roles", { method: "POST", body: input });
}

export async function updateRole(
  id: string,
  input: UpdateRoleInput,
): Promise<Role> {
  return apiFetch<Role>(`/roles/${id}`, { method: "PATCH", body: input });
}

export async function deleteRole(id: string): Promise<void> {
  return apiFetch<void>(`/roles/${id}`, { method: "DELETE" });
}

export async function fetchRoleUsers(roleId: string): Promise<RoleUser[]> {
  return apiFetch<RoleUser[]>(`/roles/${roleId}/users`);
}

export async function addRoleUser(
  roleId: string,
  userId: string,
): Promise<void> {
  return apiFetch<void>(`/roles/${roleId}/users`, {
    method: "POST",
    body: { userId },
  });
}

export async function removeRoleUser(
  roleId: string,
  userId: string,
): Promise<void> {
  return apiFetch<void>(`/roles/${roleId}/users/${userId}`, {
    method: "DELETE",
  });
}

export async function setRoleMenuPermissions(
  roleId: string,
  permissions: RoleMenuPermission[],
): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/roles/${roleId}/menus`, {
    method: "PUT",
    body: { permissions },
  });
}
