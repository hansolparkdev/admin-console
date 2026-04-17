import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MenusService } from './menus.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { ReorderMenuDto } from './dto/reorder-menu.dto';
import { Roles } from '../auth/guards/roles.decorator';

/**
 * 메뉴 관리 컨트롤러.
 * GET /menus는 인증된 사용자 전체 접근 (RbacGuard @Roles 없음).
 * 나머지(CUD)는 SUPER_ADMIN 전용.
 */
@Controller('menus')
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  /** GET /menus — 전체 메뉴 트리 (모든 인증 사용자) */
  @Get()
  findAll() {
    return this.menusService.findAll();
  }

  /** POST /menus — 메뉴 생성 (SUPER_ADMIN) */
  @Post()
  @Roles('SUPER_ADMIN')
  create(@Body() dto: CreateMenuDto) {
    return this.menusService.create(dto);
  }

  /** PATCH /menus/:id — 메뉴 수정 (SUPER_ADMIN) */
  @Patch(':id')
  @Roles('SUPER_ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateMenuDto) {
    return this.menusService.update(id, dto);
  }

  /** DELETE /menus/:id — 메뉴 삭제 (SUPER_ADMIN) */
  @Delete(':id')
  @Roles('SUPER_ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.menusService.remove(id);
  }

  /** PATCH /menus/:id/order — 순서 변경 (SUPER_ADMIN) */
  @Patch(':id/order')
  @Roles('SUPER_ADMIN')
  reorder(@Param('id') id: string, @Body() dto: ReorderMenuDto) {
    return this.menusService.reorder(id, dto.direction);
  }
}
