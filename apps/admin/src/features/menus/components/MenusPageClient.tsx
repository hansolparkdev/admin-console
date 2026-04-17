"use client";

import { useState } from "react";
import { MenuTree } from "./MenuTree";
import { MenuFormDialog } from "./MenuFormDialog";
import type { MenuNode } from "../types";

/**
 * /admin/menus 페이지 클라이언트 컴포넌트.
 * 메뉴 트리 + 생성/수정 다이얼로그 상태 관리.
 */
export function MenusPageClient() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMenu, setEditMenu] = useState<MenuNode | undefined>(undefined);

  const handleEdit = (menu: MenuNode) => {
    setEditMenu(menu);
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setEditMenu(undefined);
  };

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
        <h1 style={{ fontSize: "24px", fontWeight: 700 }}>메뉴 관리</h1>
        <button
          type="button"
          onClick={() => {
            setEditMenu(undefined);
            setDialogOpen(true);
          }}
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
          메뉴 추가
        </button>
      </div>

      <MenuTree onEdit={handleEdit} />

      <MenuFormDialog open={dialogOpen} onClose={handleClose} menu={editMenu} />
    </div>
  );
}
