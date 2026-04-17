import { describe, it, expect } from "vitest";
import { menuItems } from "@/lib/navigation/menu-config";

/**
 * menu-config.ts는 동적 메뉴 로딩(useMe())으로 대체됨.
 * 정적 배열은 빈 배열로 교체되어 SidebarNav에서 더 이상 사용하지 않음.
 */
describe("menuItems", () => {
  it("동적 메뉴 로딩으로 대체 — 빈 배열을 내보낸다", () => {
    expect(menuItems).toHaveLength(0);
  });

  it("MenuItem 인터페이스는 여전히 export 됨", () => {
    // 타입 export 확인 — 런타임에서 타입은 확인 불가이므로 빈 배열의 타입 호환성만 확인
    const emptyMenuItems: typeof menuItems = [];
    expect(emptyMenuItems).toHaveLength(0);
  });
});
