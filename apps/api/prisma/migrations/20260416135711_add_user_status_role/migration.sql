-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('pending', 'active', 'rejected');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('super_admin', 'admin');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'admin',
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'pending';
