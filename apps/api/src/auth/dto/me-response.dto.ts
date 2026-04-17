/**
 * GET /auth/me 응답 DTO.
 * roles[], menus(MenuTreeNode) 포함.
 */

export class MenuTreeNodeDto {
  id: string;
  name: string;
  path: string | null;
  icon: string | null;
  order: number;
  permissions: {
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
  };
  children: MenuTreeNodeDto[];
}

export class MeResponseDto {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  status: string;
  roles: string[];
  menus: MenuTreeNodeDto[];
}
