"use client";

import {
  useMenus,
  useDeleteMenu,
  useReorderMenu,
} from "@/features/menus/queries";
import type { MenuNode } from "../types";

interface MenuTreeProps {
  onEdit: (menu: MenuNode) => void;
}

/**
 * 메뉴 트리 컴포넌트.
 * 3-state 처리: 로딩 / 빈 목록 / 정상 렌더링
 */
export function MenuTree({ onEdit }: MenuTreeProps) {
  const { data: menus, isPending, isError } = useMenus();
  const deleteMutation = useDeleteMenu();
  const reorderMutation = useReorderMenu();

  if (isPending) {
    return (
      <div data-testid="menu-tree-loading" style={{ padding: "16px" }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: "44px",
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
      <div style={{ padding: "16px", color: "var(--destructive)" }}>
        메뉴를 불러올 수 없습니다.
      </div>
    );
  }

  if (!menus || menus.length === 0) {
    return (
      <div style={{ padding: "16px", color: "var(--muted-foreground)" }}>
        등록된 메뉴가 없습니다.
      </div>
    );
  }

  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {menus.map((menu, index) => (
        <MenuTreeItem
          key={menu.id}
          menu={menu}
          siblings={menus}
          index={index}
          depth={0}
          onEdit={onEdit}
          onDelete={(id) => deleteMutation.mutate(id)}
          onReorder={(id, direction) =>
            reorderMutation.mutate({ id, direction })
          }
        />
      ))}
    </ul>
  );
}

interface MenuTreeItemProps {
  menu: MenuNode;
  siblings: MenuNode[];
  index: number;
  depth: number;
  onEdit: (menu: MenuNode) => void;
  onDelete: (id: string) => void;
  onReorder: (id: string, direction: "up" | "down") => void;
}

function MenuTreeItem({
  menu,
  siblings,
  index,
  depth,
  onEdit,
  onDelete,
  onReorder,
}: MenuTreeItemProps) {
  const isFirst = index === 0;
  const isLast = index === siblings.length - 1;

  return (
    <li
      data-inactive={!menu.isActive ? "true" : undefined}
      style={{
        borderBottom: "1px solid var(--border)",
        opacity: menu.isActive ? 1 : 0.5,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "12px 16px",
          paddingLeft: `${16 + depth * 24}px`,
        }}
      >
        <span style={{ flex: 1, fontSize: "14px" }}>{menu.name}</span>
        {menu.path && (
          <span style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>
            {menu.path}
          </span>
        )}
        <span
          style={{
            fontSize: "11px",
            padding: "2px 6px",
            borderRadius: "4px",
            backgroundColor: menu.isActive
              ? "var(--success-bg, #d1fae5)"
              : "var(--muted)",
            color: menu.isActive
              ? "var(--success-fg, #065f46)"
              : "var(--muted-foreground)",
          }}
        >
          {menu.isActive ? "활성" : "비활성"}
        </span>
        <MenuOrderButtons
          isFirst={isFirst}
          isLast={isLast}
          onUp={() => onReorder(menu.id, "up")}
          onDown={() => onReorder(menu.id, "down")}
        />
        <button
          type="button"
          onClick={() => onEdit(menu)}
          style={{ fontSize: "12px", padding: "4px 8px", cursor: "pointer" }}
        >
          수정
        </button>
        <button
          type="button"
          onClick={() => onDelete(menu.id)}
          style={{
            fontSize: "12px",
            padding: "4px 8px",
            cursor: "pointer",
            color: "var(--destructive)",
          }}
        >
          삭제
        </button>
      </div>
      {menu.children.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {menu.children.map((child, childIndex) => (
            <MenuTreeItem
              key={child.id}
              menu={child}
              siblings={menu.children}
              index={childIndex}
              depth={depth + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onReorder={onReorder}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

interface MenuOrderButtonsProps {
  isFirst: boolean;
  isLast: boolean;
  onUp: () => void;
  onDown: () => void;
}

export function MenuOrderButtons({
  isFirst,
  isLast,
  onUp,
  onDown,
}: MenuOrderButtonsProps) {
  return (
    <div style={{ display: "flex", gap: "4px" }}>
      <button
        type="button"
        onClick={onUp}
        disabled={isFirst}
        aria-label="위로"
        style={{
          padding: "2px 6px",
          fontSize: "12px",
          cursor: isFirst ? "not-allowed" : "pointer",
        }}
      >
        ↑ 위로
      </button>
      <button
        type="button"
        onClick={onDown}
        disabled={isLast}
        aria-label="아래로"
        style={{
          padding: "2px 6px",
          fontSize: "12px",
          cursor: isLast ? "not-allowed" : "pointer",
        }}
      >
        ↓ 아래로
      </button>
    </div>
  );
}
