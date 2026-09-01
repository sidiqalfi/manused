-- CreateTable
CREATE TABLE "ArisanPeriod" (
    "id" UUID NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "contributionAmount" INTEGER NOT NULL,
    "payoutTarget" INTEGER NOT NULL,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArisanPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArisanIncome" (
    "id" UUID NOT NULL,
    "periodId" UUID NOT NULL,
    "memberId" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "paidAt" DATE NOT NULL,
    "note" TEXT,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArisanIncome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArisanDraw" (
    "id" UUID NOT NULL,
    "periodId" UUID NOT NULL,
    "winnerMemberId" UUID NOT NULL,
    "cycleNumber" INTEGER NOT NULL,
    "collectedAmount" INTEGER NOT NULL,
    "payoutAmount" INTEGER NOT NULL,
    "savingsAfter" INTEGER NOT NULL,
    "drawnAt" DATE NOT NULL,
    "voided" BOOLEAN NOT NULL DEFAULT false,
    "voidedAt" DATE,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArisanDraw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "ArisanPeriod_month_year_key" ON "ArisanPeriod"("month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "ArisanIncome_periodId_memberId_key" ON "ArisanIncome"("periodId", "memberId");

-- AddForeignKey
ALTER TABLE "ArisanPeriod" ADD CONSTRAINT "ArisanPeriod_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArisanIncome" ADD CONSTRAINT "ArisanIncome_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "ArisanPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArisanIncome" ADD CONSTRAINT "ArisanIncome_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArisanIncome" ADD CONSTRAINT "ArisanIncome_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArisanDraw" ADD CONSTRAINT "ArisanDraw_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "ArisanPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArisanDraw" ADD CONSTRAINT "ArisanDraw_winnerMemberId_fkey" FOREIGN KEY ("winnerMemberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArisanDraw" ADD CONSTRAINT "ArisanDraw_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
