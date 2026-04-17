import type { ComponentType } from "react";

/**
 * 정적 메뉴 설정.
 * 동적 메뉴 로딩(SidebarNav → useMe())으로 대체됨.
 * 하위 호환성을 위해 빈 배열로 유지. 새 메뉴는 DB에서 관리.
 */
export interface MenuItem {
  label: string;
  href: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}

export const menuItems: MenuItem[] = [];
