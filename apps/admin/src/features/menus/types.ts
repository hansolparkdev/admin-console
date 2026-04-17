/**
 * menus 도메인 타입 정의.
 * 백엔드 GET /menus 응답 구조.
 */
export interface MenuNode {
  id: string;
  name: string;
  path: string | null;
  icon: string | null;
  order: number;
  isActive: boolean;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  children: MenuNode[];
}

export interface CreateMenuInput {
  name: string;
  path?: string;
  icon?: string;
  order?: number;
  isActive?: boolean;
  parentId?: string;
}

export interface UpdateMenuInput {
  name?: string;
  path?: string;
  icon?: string;
  order?: number;
  isActive?: boolean;
  parentId?: string;
}
