"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMe } from "@/features/auth/queries";
import { isMenuActive } from "@/lib/navigation/is-menu-active";
import type { MenuTreeNode } from "@/features/auth/types";

/**
 * 사이드바 네비게이션 — /auth/me 응답 menus 트리 기반 동적 렌더링.
 *
 * 3-state 처리 (forbidden-patterns.md §5.1):
 * - 로딩: 스켈레톤
 * - 에러: 재시도 버튼
 * - 역할 없음(menus=[]) → "역할이 할당되지 않았습니다" 안내
 * - 정상: 메뉴 링크 목록
 */
export function SidebarNav() {
  const pathname = usePathname();
  const { data: me, isPending, isError, refetch } = useMe();

  if (isPending) {
    return (
      <nav aria-label="사이드바 주 메뉴" data-testid="sidebar-skeleton">
        <ul
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            padding: "16px",
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <li key={i}>
              <div
                style={{
                  height: "44px",
                  borderRadius: "8px",
                  backgroundColor:
                    "var(--sidebar-skeleton-bg, rgba(255,255,255,0.1))",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
            </li>
          ))}
        </ul>
      </nav>
    );
  }

  if (isError) {
    return (
      <nav aria-label="사이드바 주 메뉴" style={{ padding: "16px" }}>
        <p
          style={{
            color: "var(--sidebar-muted-foreground)",
            fontSize: "14px",
            marginBottom: "8px",
          }}
        >
          메뉴를 불러올 수 없습니다.
        </p>
        <button
          type="button"
          onClick={() => void refetch()}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            backgroundColor: "var(--sidebar-accent)",
            color: "var(--sidebar-accent-foreground)",
            fontSize: "14px",
            border: "none",
            cursor: "pointer",
          }}
        >
          재시도
        </button>
      </nav>
    );
  }

  const menus = me?.menus ?? [];

  if (menus.length === 0) {
    return (
      <nav aria-label="사이드바 주 메뉴" style={{ padding: "16px" }}>
        <p
          style={{ color: "var(--sidebar-muted-foreground)", fontSize: "14px" }}
        >
          역할이 할당되지 않았습니다.
        </p>
      </nav>
    );
  }

  return (
    <nav
      aria-label="사이드바 주 메뉴"
      style={{
        flex: 1,
        paddingLeft: "16px",
        paddingRight: "16px",
      }}
    >
      <ul
        style={{ display: "flex", flexDirection: "column", gap: "4px" }}
        role="list"
      >
        {menus.map((item) => (
          <MenuNavItem
            key={item.id}
            item={item}
            pathname={pathname}
            depth={0}
          />
        ))}
      </ul>
    </nav>
  );
}

function MenuNavItem({
  item,
  pathname,
  depth,
}: {
  item: MenuTreeNode;
  pathname: string;
  depth: number;
}) {
  const active = item.path ? isMenuActive(pathname, item.path) : false;
  // 그룹 메뉴(path=null이고 자식이 있는 경우)는 기본적으로 펼쳐진 상태
  const isGroup = !item.path && item.children.length > 0;
  const [expanded, setExpanded] = useState(true);

  return (
    <li>
      {item.path ? (
        <Link
          href={item.path}
          aria-current={active ? "page" : undefined}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            paddingLeft: `${16 + depth * 16}px`,
            paddingRight: "16px",
            paddingTop: "12px",
            paddingBottom: "12px",
            fontFamily: "var(--font-heading), Manrope, sans-serif",
            fontWeight: active ? 600 : 500,
            fontSize: "14px",
            letterSpacing: "-0.01em",
            textDecoration: "none",
            transition: "background-color 200ms, color 200ms, transform 200ms",
            backgroundColor: active ? "var(--sidebar-accent)" : "transparent",
            color: active
              ? "var(--sidebar-accent-foreground)"
              : "var(--sidebar-muted-foreground)",
            boxShadow: active ? "0 1px 2px 0 rgb(0 0 0 / 0.05)" : "none",
          }}
          className={[
            "focus-visible:outline-none focus-visible:ring-2",
            "hover:bg-[var(--sidebar-hover-bg)] hover:text-white",
            active ? "translate-x-1 rounded-xl" : "rounded-lg",
          ].join(" ")}
        >
          <span>{item.name}</span>
        </Link>
      ) : isGroup ? (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            paddingLeft: `${16 + depth * 16}px`,
            paddingRight: "16px",
            paddingTop: "8px",
            paddingBottom: "4px",
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--sidebar-muted-foreground)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          <span>{item.name}</span>
          <span
            style={{
              fontSize: "10px",
              transition: "transform 200ms",
              transform: expanded ? "rotate(0deg)" : "rotate(-90deg)",
            }}
          >
            ▼
          </span>
        </button>
      ) : (
        <div
          style={{
            paddingLeft: `${16 + depth * 16}px`,
            paddingRight: "16px",
            paddingTop: "8px",
            paddingBottom: "4px",
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--sidebar-muted-foreground)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {item.name}
        </div>
      )}
      {item.children.length > 0 && expanded && (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {item.children.map((child) => (
            <MenuNavItem
              key={child.id}
              item={child}
              pathname={pathname}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
