import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserStatus } from '@prisma/client';
import type { MeResponseDto, MenuTreeNodeDto } from './dto/me-response.dto';

export interface UpsertUserInput {
  email: string;
  name?: string;
  picture?: string;
  providerAccountId: string;
}

export interface CheckAllowedInput {
  email: string;
  name?: string | null;
  picture?: string | null;
  providerAccountId: string;
}

export interface CheckAllowedAllowedResult {
  allowed: true;
  user: {
    email: string;
    name?: string | null;
    picture?: string | null;
    status: UserStatus;
  };
}

export interface CheckAllowedDeniedResult {
  allowed: false;
  reason: 'pending_approval' | 'rejected';
}

export type CheckAllowedResult =
  | CheckAllowedAllowedResult
  | CheckAllowedDeniedResult;

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Google OAuth 로그인 시 사용자 상태를 DB에서 조회하여 허용/거부를 결정한다.
   *
   * 흐름:
   * 1. DB 사용자 0명 → 최초 사용자를 active으로 부트스트랩 (트랜잭션)
   * 2. 기존 사용자 → 상태별 upsert 후 status 확인
   *    - pending  → { allowed: false, reason: "pending_approval" }
   *    - active   → { allowed: true }
   *    - rejected → { allowed: false, reason: "rejected" }
   */
  async checkAllowed(input: CheckAllowedInput): Promise<CheckAllowedResult> {
    const { email, name, picture, providerAccountId } = input;

    // 부트스트랩: DB에 사용자가 0명이면 최초 사용자를 active로 등록
    const totalCount = await this.prisma.user.count();
    if (totalCount === 0) {
      return this.bootstrapFirstUser({
        email,
        name,
        picture,
        providerAccountId,
      });
    }

    // 일반 upsert: 신규 사용자는 pending으로 생성, 기존 사용자는 프로필만 업데이트
    const user = await this.prisma.user.upsert({
      where: { email },
      create: {
        email,
        name: name ?? null,
        picture: picture ?? null,
        provider: 'google',
        status: UserStatus.pending,
      },
      update: {
        name: name ?? null,
        picture: picture ?? null,
      },
    });

    if (user.status === UserStatus.active) {
      return {
        allowed: true,
        user: {
          email: user.email,
          name: user.name,
          picture: user.picture,
          status: user.status,
        },
      };
    }

    if (user.status === UserStatus.rejected) {
      return { allowed: false, reason: 'rejected' };
    }

    // pending
    return { allowed: false, reason: 'pending_approval' };
  }

  /**
   * 최초 사용자를 active + SUPER_ADMIN 역할로 등록한다.
   * 트랜잭션 내에서 count를 재확인하여 경합을 방지한다.
   * 경합 시(다른 트랜잭션이 먼저 커밋) 해당 사용자는 pending으로 처리.
   */
  private async bootstrapFirstUser(input: {
    email: string;
    name?: string | null;
    picture?: string | null;
    providerAccountId: string;
  }): Promise<CheckAllowedResult> {
    const { email, name, picture } = input;

    const user = await this.prisma.$transaction(async (tx) => {
      // 트랜잭션 내에서 재확인 (경합 방지)
      const countInTx = await tx.user.count();
      if (countInTx > 0) {
        // 이미 다른 사용자가 먼저 등록됨 → pending으로 upsert
        return tx.user.upsert({
          where: { email },
          create: {
            email,
            name: name ?? null,
            picture: picture ?? null,
            provider: 'google',
            status: UserStatus.pending,
          },
          update: { name: name ?? null, picture: picture ?? null },
        });
      }

      // 최초 사용자 → active (SUPER_ADMIN 역할은 seed에서 연결)
      const newUser = await tx.user.upsert({
        where: { email },
        create: {
          email,
          name: name ?? null,
          picture: picture ?? null,
          provider: 'google',
          status: UserStatus.active,
        },
        update: { name: name ?? null, picture: picture ?? null },
      });

      // SUPER_ADMIN 역할이 있으면 연결
      const superAdminRole = await tx.role.findUnique({
        where: { name: 'SUPER_ADMIN' },
      });
      if (superAdminRole) {
        await tx.userRoleAssignment.upsert({
          where: {
            userId_roleId: { userId: newUser.id, roleId: superAdminRole.id },
          },
          create: { userId: newUser.id, roleId: superAdminRole.id },
          update: {},
        });
      }

      return newUser;
    });

    if (user.status === UserStatus.active) {
      return {
        allowed: true,
        user: {
          email: user.email,
          name: user.name,
          picture: user.picture,
          status: user.status,
        },
      };
    }

    return { allowed: false, reason: 'pending_approval' };
  }

  /**
   * Google OAuth Account 연결 레코드를 upsert한다.
   * User upsert와 별도 호출. auth.controller의 verify에서 호출.
   */
  async upsertUser(input: UpsertUserInput) {
    const { email, name, picture, providerAccountId } = input;

    const user = await this.prisma.user.upsert({
      where: { email },
      create: {
        email,
        name,
        picture,
        provider: 'google',
        status: UserStatus.pending,
      },
      update: { name, picture },
    });

    await this.prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: 'google',
          providerAccountId,
        },
      },
      create: {
        userId: user.id,
        provider: 'google',
        providerAccountId,
      },
      update: {},
    });

    return user;
  }

  /**
   * GET /auth/me — 세션 사용자 정보 + roles + menus 트리 반환.
   * 다중 역할 권한은 합집합(OR)으로 계산.
   * 비활성 메뉴(isActive=false)는 제외.
   */
  async me(email: string): Promise<MeResponseDto | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;

    const userRoles = await this.prisma.userRoleAssignment.findMany({
      where: { userId: user.id },
      include: {
        role: {
          include: {
            roleMenus: {
              include: { menu: true },
            },
          },
        },
      },
    });

    const roles = userRoles.map((ur) => ur.role.name);

    // 메뉴 권한 합집합 계산
    const menuPermMap = new Map<
      string,
      {
        menu: (typeof userRoles)[0]['role']['roleMenus'][0]['menu'];
        canRead: boolean;
        canWrite: boolean;
        canDelete: boolean;
      }
    >();

    for (const ur of userRoles) {
      for (const rm of ur.role.roleMenus) {
        if (!rm.menu.isActive) continue;
        const existing = menuPermMap.get(rm.menu.id);
        if (existing) {
          existing.canRead = existing.canRead || rm.canRead;
          existing.canWrite = existing.canWrite || rm.canWrite;
          existing.canDelete = existing.canDelete || rm.canDelete;
        } else {
          menuPermMap.set(rm.menu.id, {
            menu: rm.menu,
            canRead: rm.canRead,
            canWrite: rm.canWrite,
            canDelete: rm.canDelete,
          });
        }
      }
    }

    // parentId 기반 트리 조립
    const allMenuNodes: MenuTreeNodeDto[] = Array.from(
      menuPermMap.values(),
    ).map(({ menu, canRead, canWrite, canDelete }) => ({
      id: menu.id,
      name: menu.name,
      path: menu.path,
      icon: menu.icon,
      order: menu.order,
      permissions: { canRead, canWrite, canDelete },
      children: [],
      // parentId는 트리 조립용으로 임시 보관 (타입 외 필드)
      _parentId: menu.parentId,
    })) as (MenuTreeNodeDto & { _parentId: string | null })[];

    const nodeMap = new Map(allMenuNodes.map((n) => [n.id, n]));
    const roots: MenuTreeNodeDto[] = [];

    for (const node of allMenuNodes as (MenuTreeNodeDto & {
      _parentId: string | null;
    })[]) {
      if (!node._parentId) {
        roots.push(node);
      } else {
        const parent = nodeMap.get(node._parentId);
        if (parent) {
          parent.children.push(node);
        } else {
          // 부모 메뉴가 권한에 없으면 루트로 처리
          roots.push(node);
        }
      }
      // 임시 필드 제거
      delete (node as { _parentId?: string | null })._parentId;
    }

    // order 기준 정렬
    roots.sort((a, b) => a.order - b.order);
    for (const node of roots) {
      node.children.sort((a, b) => a.order - b.order);
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      status: user.status,
      roles,
      menus: roots,
    };
  }
}
