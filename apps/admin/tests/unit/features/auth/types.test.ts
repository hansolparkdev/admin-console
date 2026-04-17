import { describe, it, expect } from "vitest";

// 타입 정의가 올바르게 export되는지 컴파일 타임 검증
import type { MenuTreeNode, MeResponse } from "@/features/auth/types";

describe("auth types", () => {
  it("MeResponse 타입이 roles와 menus를 포함한다", () => {
    const response: MeResponse = {
      id: "user-1",
      email: "admin@example.com",
      name: "Admin",
      picture: null,
      status: "active",
      roles: ["SUPER_ADMIN"],
      menus: [],
    };
    expect(response.roles).toContain("SUPER_ADMIN");
    expect(response.menus).toEqual([]);
  });

  it("MenuTreeNode 타입이 중첩 children을 지원한다", () => {
    const node: MenuTreeNode = {
      id: "menu-1",
      name: "대시보드",
      path: "/dashboard",
      icon: "LayoutDashboard",
      order: 0,
      permissions: { canRead: true, canWrite: true, canDelete: false },
      children: [
        {
          id: "menu-2",
          name: "하위",
          path: "/sub",
          icon: null,
          order: 0,
          permissions: { canRead: true, canWrite: false, canDelete: false },
          children: [],
        },
      ],
    };
    expect(node.children).toHaveLength(1);
    expect(node.children[0]?.name).toBe("하위");
  });
});
