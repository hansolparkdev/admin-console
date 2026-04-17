import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * @Roles() 데코레이터.
 * 컨트롤러 또는 핸들러에 필요한 역할 목록을 메타데이터로 등록한다.
 * RbacGuard가 이 메타데이터를 읽어 권한 검증을 수행한다.
 *
 * @example
 * @Roles('SUPER_ADMIN')
 * @Get()
 * findAll() { ... }
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
