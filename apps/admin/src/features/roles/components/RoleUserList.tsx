"use client";

import { useRoleUsers, useRemoveRoleUser } from "@/features/roles/queries";

interface RoleUserListProps {
  roleId: string;
  isSystem: boolean;
}

export function RoleUserList({ roleId, isSystem }: RoleUserListProps) {
  const { data: users, isPending, isError } = useRoleUsers(roleId);
  const removeMutation = useRemoveRoleUser(roleId);

  if (isPending) {
    return (
      <div data-testid="role-user-list-loading" style={{ padding: "16px" }}>
        {[1, 2, 3].map((i) => (
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
        사용자를 불러올 수 없습니다.
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div style={{ color: "var(--muted-foreground)", padding: "16px" }}>
        할당된 사용자가 없습니다.
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
            이름
          </th>
          <th
            style={{
              padding: "10px 16px",
              textAlign: "left",
              fontSize: "14px",
            }}
          >
            이메일
          </th>
          <th
            style={{
              padding: "10px 16px",
              textAlign: "left",
              fontSize: "14px",
            }}
          >
            상태
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
        {users.map((user) => (
          <tr key={user.id} style={{ borderBottom: "1px solid var(--border)" }}>
            <td style={{ padding: "10px 16px", fontSize: "14px" }}>
              {user.name ?? "-"}
            </td>
            <td style={{ padding: "10px 16px", fontSize: "14px" }}>
              {user.email}
            </td>
            <td style={{ padding: "10px 16px", fontSize: "14px" }}>
              {user.status}
            </td>
            <td style={{ padding: "10px 16px", textAlign: "right" }}>
              <button
                type="button"
                onClick={() => removeMutation.mutate(user.id)}
                disabled={isSystem || removeMutation.isPending}
                aria-label="제거"
                title={
                  isSystem
                    ? "시스템 역할의 사용자는 여기서 제거할 수 없습니다"
                    : undefined
                }
                style={{
                  padding: "4px 12px",
                  fontSize: "13px",
                  cursor: isSystem ? "not-allowed" : "pointer",
                  color: isSystem
                    ? "var(--muted-foreground)"
                    : "var(--destructive)",
                  opacity: isSystem ? 0.5 : 1,
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
