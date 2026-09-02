-- CreateTable
CREATE TABLE "Role" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberRoleAssignment" (
    "id" UUID NOT NULL,
    "memberId" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "startDate" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" DATE,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberRoleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Role_rank_key" ON "Role"("rank");

-- CreateIndex
CREATE INDEX "MemberRoleAssignment_memberId_endDate_idx" ON "MemberRoleAssignment"("memberId", "endDate");

-- CreateIndex
CREATE INDEX "MemberRoleAssignment_roleId_endDate_idx" ON "MemberRoleAssignment"("roleId", "endDate");

-- AddForeignKey
ALTER TABLE "MemberRoleAssignment" ADD CONSTRAINT "MemberRoleAssignment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberRoleAssignment" ADD CONSTRAINT "MemberRoleAssignment_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
