"use client";

import { useUserRoles, useRemoveUserRole } from "../queries";

interface UserRoleListProps {
  userId: string;
}

export function UserRoleList({ userId }: UserRoleListProps) {
  const { data: roles, isPending, isError } = useUserRoles(userId);
  const removeMutation = useRemoveUserRole(userId);

  if (isPending) {
    return (
      <div data-testid="user-role-list-loading" style={{ padding: "16px" }}>
        {[1, 2].map((i) => (
          <div
            key={i}
            style={{
              height: "40px",
              borderRadius: "6px",
              backgroundColor: "var(--muted)",
              marginBottom: "8px",
            }}
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ color: "var(--destructive)", padding: "16px" }}>
        역할을 불러올 수 없습니다.
      </div>
    );
  }

  if (!roles || roles.length === 0) {
    return (
      <div style={{ color: "var(--muted-foreground)", padding: "16px" }}>
        할당된 역할이 없습니다.
      </div>
    );
  }

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ borderBottom: "2px solid var(--border)" }}>
          <th
            style={{
              padding: "10px 16px",
              textAlign: "left",
              fontSize: "14px",
            }}
          >
            역할명
          </th>
          <th
            style={{
              padding: "10px 16px",
              textAlign: "left",
              fontSize: "14px",
            }}
          >
            유형
          </th>
          <th
            style={{
              padding: "10px 16px",
              textAlign: "right",
              fontSize: "14px",
            }}
          >
            작업
          </th>
        </tr>
      </thead>
      <tbody>
        {roles.map((role) => (
          <tr
            key={role.roleId}
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <td
              style={{
                padding: "10px 16px",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              {role.roleName}
            </td>
            <td style={{ padding: "10px 16px", fontSize: "14px" }}>
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: "4px",
                  backgroundColor: role.isSystem
                    ? "var(--primary)"
                    : "var(--muted)",
                  color: role.isSystem
                    ? "var(--primary-foreground)"
                    : "var(--muted-foreground)",
                  fontSize: "12px",
                }}
              >
                {role.isSystem ? "시스템" : "사용자"}
              </span>
            </td>
            <td style={{ padding: "10px 16px", textAlign: "right" }}>
              <button
                type="button"
                onClick={() => removeMutation.mutate(role.roleId)}
                disabled={role.isSystem || removeMutation.isPending}
                aria-label="제거"
                title={
                  role.isSystem ? "시스템 역할은 제거할 수 없습니다" : undefined
                }
                style={{
                  padding: "4px 12px",
                  fontSize: "13px",
                  cursor: role.isSystem ? "not-allowed" : "pointer",
                  color: role.isSystem
                    ? "var(--muted-foreground)"
                    : "var(--destructive)",
                  opacity: role.isSystem ? 0.5 : 1,
                }}
              >
                제거
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
