-- Patungan: peserta yang tidak hadir tapi tetap iuran dengan nominal
-- yang bisa berbeda dari feePerPerson.
ALTER TABLE "KegiatanParticipant" ADD COLUMN "attending" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "KegiatanParticipant" ADD COLUMN "expectedAmount" INTEGER;
