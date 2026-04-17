/**
 * MenuNode DTO — menus.service 및 menus.controller에서 공유하는 트리 노드 타입.
 * menus.service.ts 내부 private 타입을 외부 참조 가능하도록 분리.
 */
export interface MenuNodeDto {
  id: string;
  name: string;
  path: string | null;
  icon: string | null;
  order: number;
  isActive: boolean;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  children: MenuNodeDto[];
}
