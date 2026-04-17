-- rbac-menu-management: RBAC + 메뉴 관리 스키마 마이그레이션
-- 1) Role, Menu, RoleMenu, UserRoleAssignment 테이블 생성 (멱등)
-- 2) 기존 User.role 데이터를 UserRoleAssignment로 마이그레이션
-- 3) User.role 컬럼 및 UserRole enum 제거

-- CreateTable: Role (IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Menu (IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS "Menu" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable: RoleMenu (IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS "RoleMenu" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "canRead" BOOLEAN NOT NULL DEFAULT false,
    "canWrite" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RoleMenu_pkey" PRIMARY KEY ("id")
);

-- CreateTable: UserRoleAssignment (IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS "UserRoleAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRoleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (IF NOT EXISTS)
CREATE UNIQUE INDEX IF NOT EXISTS "Role_name_key" ON "Role"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "RoleMenu_roleId_menuId_key" ON "RoleMenu"("roleId", "menuId");
CREATE UNIQUE INDEX IF NOT EXISTS "UserRoleAssignment_userId_roleId_key" ON "UserRoleAssignment"("userId", "roleId");

-- AddForeignKey (safe)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Menu_parentId_fkey'
  ) THEN
    ALTER TABLE "Menu" ADD CONSTRAINT "Menu_parentId_fkey"
      FOREIGN KEY ("parentId") REFERENCES "Menu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'RoleMenu_roleId_fkey'
  ) THEN
    ALTER TABLE "RoleMenu" ADD CONSTRAINT "RoleMenu_roleId_fkey"
      FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'RoleMenu_menuId_fkey'
  ) THEN
    ALTER TABLE "RoleMenu" ADD CONSTRAINT "RoleMenu_menuId_fkey"
      FOREIGN KEY ("menuId") REFERENCES "Menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'UserRoleAssignment_userId_fkey'
  ) THEN
    ALTER TABLE "UserRoleAssignment" ADD CONSTRAINT "UserRoleAssignment_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'UserRoleAssignment_roleId_fkey'
  ) THEN
    ALTER TABLE "UserRoleAssignment" ADD CONSTRAINT "UserRoleAssignment_roleId_fkey"
      FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- DataMigration: SUPER_ADMIN 역할 생성 (upsert)
INSERT INTO "Role" ("id", "name", "description", "isSystem", "createdAt", "updatedAt")
VALUES (
  'role-super-admin-system',
  'SUPER_ADMIN',
  '시스템 슈퍼 관리자 역할',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("name") DO NOTHING;

-- DataMigration: ADMIN 역할 생성 (upsert)
INSERT INTO "Role" ("id", "name", "description", "isSystem", "createdAt", "updatedAt")
VALUES (
  'role-admin-system',
  'ADMIN',
  '일반 관리자 역할',
  false,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("name") DO NOTHING;

-- DataMigration: role='super_admin' 사용자 → SUPER_ADMIN UserRoleAssignment 연결
INSERT INTO "UserRoleAssignment" ("id", "userId", "roleId", "createdAt")
SELECT
  gen_random_uuid()::text,
  u."id",
  (SELECT "id" FROM "Role" WHERE "name" = 'SUPER_ADMIN'),
  CURRENT_TIMESTAMP
FROM "User" u
WHERE u."role" = 'super_admin'
ON CONFLICT ("userId", "roleId") DO NOTHING;

-- DataMigration: role='admin' 사용자 → ADMIN UserRoleAssignment 연결
INSERT INTO "UserRoleAssignment" ("id", "userId", "roleId", "createdAt")
SELECT
  gen_random_uuid()::text,
  u."id",
  (SELECT "id" FROM "Role" WHERE "name" = 'ADMIN'),
  CURRENT_TIMESTAMP
FROM "User" u
WHERE u."role" = 'admin'
ON CONFLICT ("userId", "roleId") DO NOTHING;

-- AlterTable: User.role 컬럼 제거
ALTER TABLE "User" DROP COLUMN IF EXISTS "role";

-- DropEnum: UserRole enum 제거 (IF EXISTS)
DROP TYPE IF EXISTS "UserRole";
