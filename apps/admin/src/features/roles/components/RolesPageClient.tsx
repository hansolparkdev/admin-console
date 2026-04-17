"use client";

import { useState } from "react";
import { RoleList } from "./RoleList";
import { RoleFormDialog } from "./RoleFormDialog";

/**
 * /admin/roles 페이지 클라이언트 컴포넌트.
 * 역할 목록 + 생성 다이얼로그 상태 관리.
 * 수정은 /admin/roles/[id] 상세 페이지에서 처리.
 */
export function RolesPageClient() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
        }}
      >
        <h1 style={{ fontSize: "24px", fontWeight: 700 }}>역할 관리</h1>
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            backgroundColor: "var(--primary)",
            color: "var(--primary-foreground)",
            border: "none",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          역할 추가
        </button>
      </div>

      <RoleList />

      <RoleFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
