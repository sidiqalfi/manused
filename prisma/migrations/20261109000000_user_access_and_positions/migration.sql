BEGIN;

CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');
ALTER TABLE "User"
  ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER',
  ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Rename existing tables and keys in place to preserve IDs and assignment history.
ALTER TABLE "Role" RENAME TO "Position";
ALTER TABLE "Position" RENAME CONSTRAINT "Role_pkey" TO "Position_pkey";
ALTER INDEX "Role_name_key" RENAME TO "Position_name_key";
ALTER INDEX "Role_rank_key" RENAME TO "Position_rank_key";

ALTER TABLE "MemberRoleAssignment" RENAME TO "MemberPositionAssignment";
ALTER TABLE "MemberPositionAssignment" RENAME COLUMN "roleId" TO "positionId";
ALTER TABLE "MemberPositionAssignment" RENAME CONSTRAINT "MemberRoleAssignment_pkey" TO "MemberPositionAssignment_pkey";
ALTER TABLE "MemberPositionAssignment" RENAME CONSTRAINT "MemberRoleAssignment_memberId_fkey" TO "MemberPositionAssignment_memberId_fkey";
ALTER TABLE "MemberPositionAssignment" RENAME CONSTRAINT "MemberRoleAssignment_roleId_fkey" TO "MemberPositionAssignment_positionId_fkey";
ALTER INDEX "MemberRoleAssignment_memberId_endDate_idx" RENAME TO "MemberPositionAssignment_memberId_endDate_idx";
ALTER INDEX "MemberRoleAssignment_roleId_endDate_idx" RENAME TO "MemberPositionAssignment_positionId_endDate_idx";

COMMIT;
