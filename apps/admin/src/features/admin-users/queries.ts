/**
 * admin-users 도메인 Query Key Factory + hooks.
 *
 * 문자열 리터럴 queryKey 금지(forbidden-patterns.md §2.1) 준수.
 * 낙관적 업데이트는 setState+await 금지(§2.2), queryClient.setQueryData 사용.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAdminUsers,
  fetchAdminUser,
  approveAdminUser,
  rejectAdminUser,
  restoreAdminUser,
  fetchUserRoles,
  assignUserRole,
  removeUserRole,
} from "./api";
import type { AdminUser, AdminUserStatus } from "./types";

// ─── Query Key Factory ──────────────────────────────────────────────────────

export const adminUserKeys = {
  all: ["admin-users"] as const,
  lists: () => [...adminUserKeys.all, "list"] as const,
  list: (status: AdminUserStatus | undefined, page: number) =>
    [...adminUserKeys.all, "list", status, page] as const,
  detail: (id: string) => [...adminUserKeys.all, "detail", id] as const,
};

// ─── useAdminUsers ──────────────────────────────────────────────────────────

export function useAdminUsers(status?: AdminUserStatus, page = 1) {
  return useQuery({
    queryKey: adminUserKeys.list(status, page),
    queryFn: () => fetchAdminUsers(status, page),
  });
}

// ─── useAdminUser ───────────────────────────────────────────────────────────

export function useAdminUser(id: string) {
  return useQuery({
    queryKey: adminUserKeys.detail(id),
    queryFn: () => fetchAdminUser(id),
    enabled: Boolean(id),
  });
}

// ─── mutations ──────────────────────────────────────────────────────────────

export function useApproveAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approveAdminUser(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: adminUserKeys.detail(id) });
      const previous = queryClient.getQueryData<AdminUser>(
        adminUserKeys.detail(id),
      );
      return { previous, id };
    },
    onError: (_err, id, context) => {
      // 실패 시 이전 상태로 롤백
      if (context?.previous) {
        queryClient.setQueryData<AdminUser>(
          adminUserKeys.detail(id),
          context.previous,
        );
      }
    },
    onSuccess: (updated) => {
      // 낙관적 업데이트: queryClient.setQueryData 사용 (setState+await 금지)
      queryClient.setQueryData<AdminUser>(
        adminUserKeys.detail(updated.id),
        updated,
      );
      void queryClient.invalidateQueries({ queryKey: adminUserKeys.lists() });
    },
  });
}

export function useRejectAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rejectAdminUser(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: adminUserKeys.detail(id) });
      const previous = queryClient.getQueryData<AdminUser>(
        adminUserKeys.detail(id),
      );
      return { previous, id };
    },
    onError: (_err, id, context) => {
      if (context?.previous) {
        queryClient.setQueryData<AdminUser>(
          adminUserKeys.detail(id),
          context.previous,
        );
      }
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<AdminUser>(
        adminUserKeys.detail(updated.id),
        updated,
      );
      void queryClient.invalidateQueries({ queryKey: adminUserKeys.lists() });
    },
  });
}

export function useUserRoles(userId: string) {
  return useQuery({
    queryKey: [...adminUserKeys.detail(userId), "roles"] as const,
    queryFn: () => fetchUserRoles(userId),
    enabled: Boolean(userId),
  });
}

export function useAssignUserRole(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roleId: string) => assignUserRole(userId, roleId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [...adminUserKeys.detail(userId), "roles"],
      });
    },
  });
}

export function useRemoveUserRole(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roleId: string) => removeUserRole(userId, roleId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [...adminUserKeys.detail(userId), "roles"],
      });
    },
  });
}

export function useRestoreAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      targetStatus,
    }: {
      id: string;
      targetStatus: "pending" | "active";
    }) => restoreAdminUser(id, targetStatus),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: adminUserKeys.detail(id) });
      const previous = queryClient.getQueryData<AdminUser>(
        adminUserKeys.detail(id),
      );
      return { previous, id };
    },
    onError: (_err, { id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData<AdminUser>(
          adminUserKeys.detail(id),
          context.previous,
        );
      }
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<AdminUser>(
        adminUserKeys.detail(updated.id),
        updated,
      );
      void queryClient.invalidateQueries({ queryKey: adminUserKeys.lists() });
    },
  });
}
