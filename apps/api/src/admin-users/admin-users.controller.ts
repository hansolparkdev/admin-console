import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { Roles } from '../auth/guards/roles.decorator';
import { UserStatus } from '@prisma/client';

interface AuthenticatedRequest {
  user?: { sub?: string };
}

@Controller('admin/users')
@Roles('SUPER_ADMIN')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  /** GET /admin/users?status=pending|active|rejected&page=1&limit=10 */
  @Get()
  findAll(
    @Query('status') status?: UserStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminUsersService.findAll(
      status,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  /** GET /admin/users/:id */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminUsersService.findOne(id);
  }

  /** PATCH /admin/users/:id/approve */
  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    return this.adminUsersService.approve(id);
  }

  /** PATCH /admin/users/:id/reject */
  @Patch(':id/reject')
  reject(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const requesterId = req.user?.sub ?? '';
    return this.adminUsersService.reject(id, requesterId);
  }

  /** PATCH /admin/users/:id/restore */
  @Patch(':id/restore')
  restore(
    @Param('id') id: string,
    @Body() body: { targetStatus: 'pending' | 'active' },
  ) {
    return this.adminUsersService.restore(id, body.targetStatus);
  }

  /** GET /admin/users/:id/roles — 역할 목록 */
  @Get(':id/roles')
  getUserRoles(@Param('id') id: string) {
    return this.adminUsersService.getUserRoles(id);
  }

  /** POST /admin/users/:id/roles — 역할 할당 */
  @Post(':id/roles')
  assignRole(@Param('id') id: string, @Body() body: { roleId: string }) {
    return this.adminUsersService.assignRole(id, body.roleId);
  }

  /** DELETE /admin/users/:id/roles/:roleId — 역할 제거 */
  @Delete(':id/roles/:roleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeRole(@Param('id') id: string, @Param('roleId') roleId: string) {
    return this.adminUsersService.removeRole(id, roleId);
  }
}
