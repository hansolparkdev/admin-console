import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserStatus } from '@prisma/client';

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(status?: UserStatus, page = 1, limit = 10) {
    const where = status ? { status } : {};
    const skip = (page - 1) * limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async approve(id: string) {
    const user = await this.findOne(id);
    if (user.status === UserStatus.active) {
      throw new ConflictException('User is already active');
    }
    return this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.active },
    });
  }

  async reject(id: string, requesterId: string) {
    const user = await this.findOne(id);
    if (user.id === requesterId) {
      throw new BadRequestException('Cannot reject yourself');
    }
    return this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.rejected },
    });
  }

  async restore(id: string, targetStatus: 'pending' | 'active') {
    const user = await this.findOne(id);
    if (user.status !== UserStatus.rejected) {
      throw new BadRequestException('Only rejected users can be restored');
    }
    const newStatus =
      targetStatus === 'active' ? UserStatus.active : UserStatus.pending;
    return this.prisma.user.update({
      where: { id },
      data: { status: newStatus },
    });
  }

  /**
   * 관리자 역할 목록 조회.
   */
  async getUserRoles(userId: string) {
    await this.findOne(userId);
    return this.prisma.userRoleAssignment.findMany({
      where: { userId },
      include: { role: true },
    });
  }

  /**
   * 관리자에게 역할 할당.
   * - active 상태인 사용자만 역할 할당 가능.
   * - 이미 할당된 역할은 ConflictException.
   */
  async assignRole(userId: string, roleId: string) {
    const user = await this.findOne(userId);

    if (user.status !== UserStatus.active) {
      throw new ConflictException(
        '활성 상태인 관리자에게만 역할을 할당할 수 있습니다',
      );
    }

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
   * 관리자 역할 제거.
   * - 마지막 SUPER_ADMIN 역할 제거 차단.
   */
  async removeRole(userId: string, roleId: string) {
    await this.findOne(userId);

    const assignment = await this.prisma.userRoleAssignment.findUnique({
      where: { userId_roleId: { userId, roleId } },
      include: { role: true },
    });

    if (!assignment) {
      throw new NotFoundException(`역할 할당을 찾을 수 없습니다`);
    }

    // SUPER_ADMIN 마지막 보유자 제거 차단
    if (assignment.role.name === 'SUPER_ADMIN') {
      const superAdminCount = await this.prisma.userRoleAssignment.count({
        where: { roleId },
      });
      if (superAdminCount <= 1) {
        throw new ConflictException(
          '마지막 SUPER_ADMIN 관리자의 역할은 제거할 수 없습니다',
        );
      }
    }

    return this.prisma.userRoleAssignment.delete({
      where: { userId_roleId: { userId, roleId } },
    });
  }
}
