import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleMenuPermissionDto } from './dto/role-menu-permission.dto';
import { Roles } from '../auth/guards/roles.decorator';

@Controller('roles')
@Roles('SUPER_ADMIN')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  /** GET /roles — 역할 목록 */
  @Get()
  findAll() {
    return this.rolesService.findAll();
  }

  /** GET /roles/:id — 역할 상세 */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  /** POST /roles — 역할 생성 */
  @Post()
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  /** PATCH /roles/:id — 역할 수정 */
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(id, dto);
  }

  /** DELETE /roles/:id — 역할 삭제 */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }

  /** GET /roles/:id/users — 역할에 할당된 사용자 목록 */
  @Get(':id/users')
  getUsers(@Param('id') id: string) {
    return this.rolesService.getUsers(id);
  }

  /** POST /roles/:id/users — 역할에 사용자 추가 */
  @Post(':id/users')
  addUser(@Param('id') id: string, @Body() body: { userId: string }) {
    return this.rolesService.addUser(id, body.userId);
  }

  /** DELETE /roles/:id/users/:userId — 역할에서 사용자 제거 */
  @Delete(':id/users/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeUser(@Param('id') id: string, @Param('userId') userId: string) {
    return this.rolesService.removeUser(id, userId);
  }

  /** PUT /roles/:id/menus — 메뉴 권한 일괄 저장 */
  @Put(':id/menus')
  setMenuPermissions(
    @Param('id') id: string,
    @Body() dto: RoleMenuPermissionDto,
  ) {
    return this.rolesService.setMenuPermissions(id, dto.permissions);
  }
}
