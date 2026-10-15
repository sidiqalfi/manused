-- CreateEnum
CREATE TYPE "KegiatanStatus" AS ENUM ('PLANNED', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "CashExpense" ADD COLUMN     "relatedEventId" UUID;

-- CreateTable
CREATE TABLE "Kegiatan" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "eventDate" DATE NOT NULL,
    "location" TEXT,
    "feePerPerson" INTEGER NOT NULL,
    "status" "KegiatanStatus" NOT NULL DEFAULT 'PLANNED',
    "note" TEXT,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Kegiatan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KegiatanParticipant" (
    "id" UUID NOT NULL,
    "kegiatanId" UUID NOT NULL,
    "memberId" UUID NOT NULL,
    "joinedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" UUID NOT NULL,

    CONSTRAINT "KegiatanParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KegiatanPayment" (
    "id" UUID NOT NULL,
    "kegiatanId" UUID NOT NULL,
    "memberId" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "paidAt" DATE NOT NULL,
    "note" TEXT,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KegiatanPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KegiatanExpense" (
    "id" UUID NOT NULL,
    "kegiatanId" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "spentAt" DATE NOT NULL,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KegiatanExpense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Kegiatan_eventDate_idx" ON "Kegiatan"("eventDate");

-- CreateIndex
CREATE UNIQUE INDEX "KegiatanParticipant_kegiatanId_memberId_key" ON "KegiatanParticipant"("kegiatanId", "memberId");

-- CreateIndex
CREATE INDEX "KegiatanPayment_kegiatanId_memberId_idx" ON "KegiatanPayment"("kegiatanId", "memberId");

-- AddForeignKey
ALTER TABLE "CashExpense" ADD CONSTRAINT "CashExpense_relatedEventId_fkey" FOREIGN KEY ("relatedEventId") REFERENCES "Kegiatan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kegiatan" ADD CONSTRAINT "Kegiatan_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KegiatanParticipant" ADD CONSTRAINT "KegiatanParticipant_kegiatanId_fkey" FOREIGN KEY ("kegiatanId") REFERENCES "Kegiatan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KegiatanParticipant" ADD CONSTRAINT "KegiatanParticipant_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KegiatanParticipant" ADD CONSTRAINT "KegiatanParticipant_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KegiatanPayment" ADD CONSTRAINT "KegiatanPayment_kegiatanId_fkey" FOREIGN KEY ("kegiatanId") REFERENCES "Kegiatan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KegiatanPayment" ADD CONSTRAINT "KegiatanPayment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KegiatanPayment" ADD CONSTRAINT "KegiatanPayment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KegiatanExpense" ADD CONSTRAINT "KegiatanExpense_kegiatanId_fkey" FOREIGN KEY ("kegiatanId") REFERENCES "Kegiatan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KegiatanExpense" ADD CONSTRAINT "KegiatanExpense_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
