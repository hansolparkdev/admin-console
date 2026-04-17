import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateMenuDto } from './dto/create-menu.dto';
import type { UpdateMenuDto } from './dto/update-menu.dto';
import type { MenuNodeDto } from './dto/menu-node.dto';

@Injectable()
export class MenusService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 모든 메뉴를 parentId 기반 트리 구조로 반환.
   */
  async findAll(): Promise<MenuNodeDto[]> {
    const menus = await this.prisma.menu.findMany({
      orderBy: { order: 'asc' },
    });

    return this.buildTree(menus);
  }

  private buildTree(
    menus: Omit<MenuNodeDto, 'children'>[],
    parentId: string | null = null,
  ): MenuNodeDto[] {
    return menus
      .filter((m) => m.parentId === parentId)
      .map((m) => ({
        ...m,
        children: this.buildTree(menus, m.id),
      }));
  }

  async findOne(id: string) {
    const menu = await this.prisma.menu.findUnique({ where: { id } });
    if (!menu) throw new NotFoundException(`Menu ${id} not found`);
    return menu;
  }

  async create(dto: CreateMenuDto) {
    return this.prisma.menu.create({
      data: {
        name: dto.name,
        path: dto.path,
        icon: dto.icon,
        order: dto.order ?? 0,
        isActive: dto.isActive ?? true,
        parentId: dto.parentId ?? null,
      },
    });
  }

  async update(id: string, dto: UpdateMenuDto) {
    await this.findOne(id);
    return this.prisma.menu.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.path !== undefined && { path: dto.path }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
        ...(dto.order !== undefined && { order: dto.order }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.parentId !== undefined && { parentId: dto.parentId }),
      },
    });
  }

  /**
   * 메뉴 삭제.
   * 하위 메뉴가 있으면 ConflictException (409).
   */
  async remove(id: string) {
    await this.findOne(id);

    const childCount = await this.prisma.menu.count({
      where: { parentId: id },
    });

    if (childCount > 0) {
      throw new ConflictException('하위 메뉴가 존재하여 삭제할 수 없습니다');
    }

    return this.prisma.menu.delete({ where: { id } });
  }

  /**
   * 메뉴 순서 변경 (같은 레벨 내 swap).
   * 최상단/최하단에서 해당 방향으로 이동 시 ConflictException.
   */
  async reorder(id: string, direction: 'up' | 'down') {
    const menu = await this.findOne(id);

    const siblings = await this.prisma.menu.findMany({
      where: { parentId: menu.parentId },
      orderBy: { order: 'asc' },
    });

    const currentIndex = siblings.findIndex((m) => m.id === id);

    if (direction === 'up' && currentIndex === 0) {
      throw new ConflictException('이미 최상단 메뉴입니다');
    }
    if (direction === 'down' && currentIndex === siblings.length - 1) {
      throw new ConflictException('이미 최하단 메뉴입니다');
    }

    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const swapMenu = siblings[swapIndex];

    if (!swapMenu) {
      throw new ConflictException('순서 변경 대상을 찾을 수 없습니다');
    }

    const currentOrder = menu.order;
    const swapOrder = swapMenu.order;

    await this.prisma.menu.update({
      where: { id: menu.id },
      data: { order: swapOrder },
    });

    await this.prisma.menu.update({
      where: { id: swapMenu.id },
      data: { order: currentOrder },
    });

    return { success: true };
  }
}
