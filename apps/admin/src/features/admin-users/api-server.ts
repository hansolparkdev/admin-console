import "server-only";
import { apiServerFetch } from "@/lib/api-server";
import type { AdminUser, AdminUserStatus, AdminUsersPage } from "./types";

/**
 * Server Component에서 호출하는 관리자 목록 조회 (페이지네이션).
 * lib/api-server.ts를 사용 (forbidden-patterns.md §2.4: Server Component에서 브라우저 fetcher 금지).
 */
export async function fetchAdminUsersServer(
  status?: AdminUserStatus,
  page = 1,
  limit = 10,
): Promise<AdminUsersPage> {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  params.set("page", String(page));
  params.set("limit", String(limit));
  return apiServerFetch<AdminUsersPage>(`/admin/users?${params.toString()}`);
}

/**
 * Server Component에서 호출하는 관리자 단건 조회.
 */
export async function fetchAdminUserServer(id: string): Promise<AdminUser> {
  return apiServerFetch<AdminUser>(`/admin/users/${id}`);
}
