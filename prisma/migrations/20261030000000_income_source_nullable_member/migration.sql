-- CreateEnum
CREATE TYPE "IncomeSource" AS ENUM ('IURAN', 'SUMBANGAN', 'LAINNYA');

-- CashIncome
ALTER TABLE "CashIncome" ADD COLUMN "sourceName" TEXT;
ALTER TABLE "CashIncome" ALTER COLUMN "memberId" DROP NOT NULL;
ALTER TABLE "CashIncome" ADD COLUMN "source" "IncomeSource" NOT NULL DEFAULT 'IURAN';

-- SosialIncome
ALTER TABLE "SosialIncome" ADD COLUMN "sourceName" TEXT;
ALTER TABLE "SosialIncome" ALTER COLUMN "memberId" DROP NOT NULL;
ALTER TABLE "SosialIncome" ADD COLUMN "source" "IncomeSource" NOT NULL DEFAULT 'IURAN';
