import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateRoleDto } from './dto/create-role.dto';
import type { UpdateRoleDto } from './dto/update-role.dto';
import type { MenuPermissionDto } from './dto/role-menu-permission.dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.role.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        _count: { select: { userRoles: true } },
      },
    });
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        roleMenus: { include: { menu: true } },
        _count: { select: { userRoles: true } },
      },
    });
    if (!role) throw new NotFoundException(`Role ${id} not found`);
    return role;
  }

  async create(dto: CreateRoleDto) {
    return this.prisma.role.create({
      data: {
        name: dto.name,
        description: dto.description,
      },
    });
  }

  async update(id: string, dto: UpdateRoleDto) {
    await this.findOne(id);
    return this.prisma.role.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });
  }

  /**
   * 역할 삭제.
   * - isSystem=true 역할 삭제 차단 (409)
   * - 할당된 관리자 있으면 삭제 차단 (409)
   */
  async remove(id: string) {
    const role = await this.findOne(id);

    if (role.isSystem) {
      throw new ConflictException('시스템 역할은 삭제할 수 없습니다');
    }

    const userCount = await this.prisma.userRoleAssignment.count({
      where: { roleId: id },
    });

    if (userCount > 0) {
      throw new ConflictException('해당 역할이 할당된 관리자가 있습니다');
    }

    return this.prisma.role.delete({ where: { id } });
  }

  /**
   * 역할에 할당된 사용자 목록 조회.
   */
  async getUsers(roleId: string) {
    await this.findOne(roleId);
    const assignments = await this.prisma.userRoleAssignment.findMany({
      where: { roleId },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });
    return assignments.map((a) => ({
      id: a.user.id,
      email: a.user.email,
      name: a.user.name,
      picture: a.user.picture,
      status: a.user.status,
      assignedAt: a.createdAt,
    }));
  }

  /**
   * 역할에 사용자 추가.
   */
  async addUser(roleId: string, userId: string) {
    await this.findOne(roleId);

    const existing = await this.prisma.userRoleAssignment.findUnique({
      where: { userId_roleId: { userId, roleId } },
    });

    if (existing) {
      throw new ConflictException('이미 해당 역할이 할당된 사용자입니다');
    }

    return this.prisma.userRoleAssignment.create({
      data: { userId, roleId },
    });
  }

  /**
   * 역할에서 사용자 제거.
   * - SUPER_ADMIN 역할의 마지막 사용자 제거 차단 (409)
   */
  async removeUser(roleId: string, userId: string) {
    const role = await this.findOne(roleId);

    // SUPER_ADMIN 역할이면 마지막 한 명 제거 차단
    if (role.name === 'SUPER_ADMIN') {
      const superAdminCount = await this.prisma.userRoleAssignment.count({
        where: { roleId },
      });

      if (superAdminCount <= 1) {
        throw new ConflictException(
          '마지막 SUPER_ADMIN 관리자는 제거할 수 없습니다',
        );
      }
    }

    return this.prisma.userRoleAssignment.delete({
      where: { userId_roleId: { userId, roleId } },
    });
  }

  /**
   * 메뉴 권한 일괄 저장 (PUT).
   * 기존 roleMenu를 모두 삭제 후 새로 생성 (트랜잭션).
   */
  async setMenuPermissions(roleId: string, permissions: MenuPermissionDto[]) {
    await this.findOne(roleId);

    await this.prisma.$transaction(async (tx) => {
      await tx.roleMenu.deleteMany({ where: { roleId } });

      for (const perm of permissions) {
        await tx.roleMenu.upsert({
          where: { roleId_menuId: { roleId, menuId: perm.menuId } },
          create: {
            roleId,
            menuId: perm.menuId,
            canRead: perm.canRead,
            canWrite: perm.canWrite,
            canDelete: perm.canDelete,
          },
          update: {
            canRead: perm.canRead,
            canWrite: perm.canWrite,
            canDelete: perm.canDelete,
          },
        });
      }
    });

    return { success: true };
  }
}
