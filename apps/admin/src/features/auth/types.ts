/**
 * auth 도메인 타입 정의.
 * Auth.js v5 세션 타입과 apps/api 응답 타입을 통합한다.
 */

export interface AuthUser {
  id?: string;
  email: string;
  name?: string | null;
  picture?: string | null;
  image?: string | null;
}

export interface AuthSession {
  user: AuthUser;
  expires: string;
}

/** POST /auth/verify 응답 — 허용 */
export interface VerifyAllowedResponse {
  allowed: true;
  user: {
    email: string;
    name?: string | null;
    picture?: string | null;
  };
}

/** POST /auth/verify 응답 — 거부 */
export interface VerifyDeniedResponse {
  allowed: false;
  reason: string;
}

export type VerifyResponse = VerifyAllowedResponse | VerifyDeniedResponse;

/** GET /auth/me 메뉴 트리 노드 */
export interface MenuTreeNode {
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
  children: MenuTreeNode[];
}

/** GET /auth/me 응답 — roles[], menus[] 포함 */
export interface MeResponse {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  status: string;
  roles: string[];
  menus: MenuTreeNode[];
}
