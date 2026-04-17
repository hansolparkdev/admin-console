import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AdminUsersModule } from './admin-users/admin-users.module';
import { MenusModule } from './menus/menus.module';
import { RolesModule } from './roles/roles.module';
import { RbacGuard } from './auth/guards/rbac.guard';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AdminUsersModule,
    MenusModule,
    RolesModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: RbacGuard,
    },
  ],
})
export class AppModule {}
