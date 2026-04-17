import { apiFetch } from "@/lib/api";
import type {
  AdminUser,
  AdminUserStatus,
  AdminUsersPage,
  UserRoleItem,
} from "./types";

/**
 * 관리자 목록 조회 (페이지네이션).
 */
export async function fetchAdminUsers(
  status?: AdminUserStatus,
  page = 1,
  limit = 10,
): Promise<AdminUsersPage> {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  params.set("page", String(page));
  params.set("limit", String(limit));
  return apiFetch<AdminUsersPage>(`/admin/users?${params.toString()}`);
}

/**
 * 관리자 단건 조회.
 */
export async function fetchAdminUser(id: string): Promise<AdminUser> {
  return apiFetch<AdminUser>(`/admin/users/${id}`);
}

/**
 * 관리자 승인 (pending → active).
 */
export async function approveAdminUser(id: string): Promise<AdminUser> {
  return apiFetch<AdminUser>(`/admin/users/${id}/approve`, { method: "PATCH" });
}

/**
 * 관리자 거절 (pending|active → rejected).
 */
export async function rejectAdminUser(id: string): Promise<AdminUser> {
  return apiFetch<AdminUser>(`/admin/users/${id}/reject`, { method: "PATCH" });
}

/**
 * 관리자 역할 목록 조회.
 */
export async function fetchUserRoles(id: string): Promise<UserRoleItem[]> {
  return apiFetch<UserRoleItem[]>(`/admin/users/${id}/roles`);
}

/**
 * 관리자 역할 할당.
 */
export async function assignUserRole(
  id: string,
  roleId: string,
): Promise<void> {
  return apiFetch<void>(`/admin/users/${id}/roles`, {
    method: "POST",
    body: { roleId },
  });
}

/**
 * 관리자 역할 제거.
 */
export async function removeUserRole(
  id: string,
  roleId: string,
): Promise<void> {
  return apiFetch<void>(`/admin/users/${id}/roles/${roleId}`, {
    method: "DELETE",
  });
}

/**
 * 관리자 복구 (rejected → pending|active).
 */
export async function restoreAdminUser(
  id: string,
  targetStatus: "pending" | "active",
): Promise<AdminUser> {
  return apiFetch<AdminUser>(`/admin/users/${id}/restore`, {
    method: "PATCH",
    body: { targetStatus },
  });
}
