-- CreateTable
CREATE TABLE "CashPeriod" (
    "id" UUID NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "duesAmount" INTEGER NOT NULL,
    "minAmount" INTEGER NOT NULL,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashIncome" (
    "id" UUID NOT NULL,
    "periodId" UUID NOT NULL,
    "memberId" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "paidAt" DATE NOT NULL,
    "note" TEXT,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashIncome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashExpense" (
    "id" UUID NOT NULL,
    "periodId" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "spentAt" DATE NOT NULL,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashExpense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CashPeriod_month_year_key" ON "CashPeriod"("month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "CashIncome_periodId_memberId_key" ON "CashIncome"("periodId", "memberId");

-- AddForeignKey
ALTER TABLE "CashPeriod" ADD CONSTRAINT "CashPeriod_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashIncome" ADD CONSTRAINT "CashIncome_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "CashPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashIncome" ADD CONSTRAINT "CashIncome_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashIncome" ADD CONSTRAINT "CashIncome_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashExpense" ADD CONSTRAINT "CashExpense_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "CashPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashExpense" ADD CONSTRAINT "CashExpense_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
