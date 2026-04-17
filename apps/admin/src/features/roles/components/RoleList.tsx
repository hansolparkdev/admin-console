"use client";

import Link from "next/link";
import { useRoles, useDeleteRole } from "@/features/roles/queries";
import type { Role } from "../types";

interface RoleListProps {
  onEdit?: (role: Role) => void;
}

export function RoleList({ onEdit }: RoleListProps) {
  const { data: roles, isPending, isError } = useRoles();
  const deleteMutation = useDeleteRole();

  if (isPending) {
    return (
      <div data-testid="role-list-loading" style={{ padding: "16px" }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: "48px",
              borderRadius: "8px",
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
        등록된 역할이 없습니다.
      </div>
    );
  }

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ borderBottom: "2px solid var(--border)" }}>
          <th
            style={{
              padding: "12px 16px",
              textAlign: "left",
              fontSize: "14px",
            }}
          >
            역할명
          </th>
          <th
            style={{
              padding: "12px 16px",
              textAlign: "left",
              fontSize: "14px",
            }}
          >
            설명
          </th>
          <th
            style={{
              padding: "12px 16px",
              textAlign: "left",
              fontSize: "14px",
            }}
          >
            유형
          </th>
          <th
            style={{
              padding: "12px 16px",
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
          <RoleRow
            key={role.id}
            role={role}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        ))}
      </tbody>
    </table>
  );
}

interface RoleRowProps {
  role: Role;
  onDelete: (id: string) => void;
}

function RoleRow({ role, onDelete }: RoleRowProps) {
  const isSystem = role.isSystem;

  return (
    <tr style={{ borderBottom: "1px solid var(--border)" }}>
      <td style={{ padding: "12px 16px", fontSize: "14px", fontWeight: 500 }}>
        {role.name}
      </td>
      <td
        style={{
          padding: "12px 16px",
          fontSize: "14px",
          color: "var(--muted-foreground)",
        }}
      >
        {role.description ?? "-"}
      </td>
      <td style={{ padding: "12px 16px", fontSize: "14px" }}>
        <span
          style={{
            padding: "2px 8px",
            borderRadius: "4px",
            backgroundColor: isSystem ? "var(--primary)" : "var(--muted)",
            color: isSystem
              ? "var(--primary-foreground)"
              : "var(--muted-foreground)",
            fontSize: "12px",
          }}
        >
          {isSystem ? "시스템" : "사용자"}
        </span>
      </td>
      <td style={{ padding: "12px 16px", textAlign: "right" }}>
        <Link
          href={`/admin/roles/${role.id}`}
          style={{
            marginRight: "8px",
            padding: "4px 12px",
            fontSize: "13px",
            cursor: "pointer",
            textDecoration: "none",
          }}
        >
          수정
        </Link>
        <button
          type="button"
          onClick={() => onDelete(role.id)}
          disabled={isSystem}
          aria-label="삭제"
          title={isSystem ? "시스템 역할은 삭제할 수 없습니다" : undefined}
          style={{
            padding: "4px 12px",
            fontSize: "13px",
            cursor: isSystem ? "not-allowed" : "pointer",
            color: isSystem ? "var(--muted-foreground)" : "var(--destructive)",
            opacity: isSystem ? 0.5 : 1,
          }}
        >
          삭제
        </button>
      </td>
    </tr>
  );
}
