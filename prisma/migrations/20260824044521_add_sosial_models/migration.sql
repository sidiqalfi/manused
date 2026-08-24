-- CreateTable
CREATE TABLE "SosialPeriod" (
    "id" UUID NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "minAmount" INTEGER NOT NULL,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SosialPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SosialIncome" (
    "id" UUID NOT NULL,
    "periodId" UUID NOT NULL,
    "memberId" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "paidAt" DATE NOT NULL,
    "note" TEXT,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SosialIncome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SosialExpense" (
    "id" UUID NOT NULL,
    "periodId" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "spentAt" DATE NOT NULL,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SosialExpense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SosialPeriod_month_year_key" ON "SosialPeriod"("month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "SosialIncome_periodId_memberId_key" ON "SosialIncome"("periodId", "memberId");

-- AddForeignKey
ALTER TABLE "SosialPeriod" ADD CONSTRAINT "SosialPeriod_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SosialIncome" ADD CONSTRAINT "SosialIncome_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "SosialPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SosialIncome" ADD CONSTRAINT "SosialIncome_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SosialIncome" ADD CONSTRAINT "SosialIncome_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SosialExpense" ADD CONSTRAINT "SosialExpense_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "SosialPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SosialExpense" ADD CONSTRAINT "SosialExpense_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
