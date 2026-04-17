"use client";

import { useState } from "react";
import { useRole } from "@/features/roles/queries";
import { RolePermissionMatrix } from "./RolePermissionMatrix";
import { RoleUserList } from "./RoleUserList";
import { RoleUserAddDialog } from "./RoleUserAddDialog";

interface RoleDetailClientProps {
  id: string;
}

export function RoleDetailClient({ id }: RoleDetailClientProps) {
  const { data: role, isPending, isError } = useRole(id);
  const [addUserOpen, setAddUserOpen] = useState(false);

  if (isPending) {
    return (
      <div style={{ padding: "16px" }}>
        <div
          style={{
            height: "32px",
            borderRadius: "6px",
            backgroundColor: "var(--muted)",
            marginBottom: "16px",
            width: "200px",
          }}
        />
        <div
          style={{
            height: "200px",
            borderRadius: "6px",
            backgroundColor: "var(--muted)",
          }}
        />
      </div>
    );
  }

  if (isError || !role) {
    return (
      <div style={{ color: "var(--destructive)", padding: "16px" }}>
        역할을 불러올 수 없습니다.
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "4px" }}>
          {role.name}
        </h1>
        {role.description && (
          <p style={{ color: "var(--muted-foreground)", fontSize: "14px" }}>
            {role.description}
          </p>
        )}
        {role.isSystem && (
          <span
            style={{
              display: "inline-block",
              padding: "2px 8px",
              borderRadius: "4px",
              backgroundColor: "var(--primary)",
              color: "var(--primary-foreground)",
              fontSize: "12px",
              marginTop: "4px",
            }}
          >
            시스템 역할
          </span>
        )}
      </div>

      <section style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>
          메뉴 권한
        </h2>
        <RolePermissionMatrix
          roleId={id}
          initialPermissions={(role.roleMenus ?? []).map((rm) => ({
            menuId: rm.menuId,
            canRead: rm.canRead,
            canWrite: rm.canWrite,
            canDelete: rm.canDelete,
          }))}
        />
      </section>

      <section>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "12px",
          }}
        >
          <h2 style={{ fontSize: "18px", fontWeight: 600 }}>할당된 사용자</h2>
          {!role.isSystem && (
            <button
              type="button"
              onClick={() => setAddUserOpen(true)}
              style={{
                padding: "6px 14px",
                borderRadius: "6px",
                backgroundColor: "var(--primary)",
                color: "var(--primary-foreground)",
                border: "none",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              사용자 추가
            </button>
          )}
        </div>
        <RoleUserList roleId={id} isSystem={role.isSystem} />
      </section>

      <RoleUserAddDialog
        open={addUserOpen}
        onClose={() => setAddUserOpen(false)}
        roleId={id}
      />
    </div>
  );
}
