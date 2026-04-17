/**
 * roles 도메인 Query Key Factory + hooks.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchRoles,
  fetchRole,
  createRole,
  updateRole,
  deleteRole,
  setRoleMenuPermissions,
  fetchRoleUsers,
  addRoleUser,
  removeRoleUser,
} from "./api";
import type {
  CreateRoleInput,
  UpdateRoleInput,
  RoleMenuPermission,
} from "./types";
import { roleKeys } from "@/lib/query-keys/role-keys";

export { roleKeys };

export function useRoles() {
  return useQuery({
    queryKey: roleKeys.lists(),
    queryFn: fetchRoles,
  });
}

export function useRole(id: string) {
  return useQuery({
    queryKey: roleKeys.detail(id),
    queryFn: () => fetchRole(id),
    enabled: Boolean(id),
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRoleInput) => createRole(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateRoleInput }) =>
      updateRole(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRole(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
    },
  });
}

export function useRoleUsers(roleId: string) {
  return useQuery({
    queryKey: roleKeys.users(roleId),
    queryFn: () => fetchRoleUsers(roleId),
    enabled: Boolean(roleId),
  });
}

export function useAddRoleUser(roleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => addRoleUser(roleId, userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: roleKeys.users(roleId) });
    },
  });
}

export function useRemoveRoleUser(roleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => removeRoleUser(roleId, userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: roleKeys.users(roleId) });
    },
  });
}

export function useSetRoleMenuPermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      roleId,
      permissions,
    }: {
      roleId: string;
      permissions: RoleMenuPermission[];
    }) => setRoleMenuPermissions(roleId, permissions),
    onSuccess: (_data, { roleId }) => {
      void queryClient.invalidateQueries({ queryKey: roleKeys.detail(roleId) });
    },
  });
}
