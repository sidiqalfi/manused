-- Sinkronisasi file migrasi dengan state DB yang sudah terlanjur dibuat
-- lewat `prisma db push` sebelumnya. Migrasi ini akan di-mark `applied`
-- tanpa dijalankan di dev (DB sudah punya objek-objek di bawah),
-- supaya future `migrate reset` / `migrate deploy` di prod tetap bisa
-- menyusun schema dari nol dengan benar.

-- Member household self-relation (sudah ada di dev DB)
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "headOfHouseholdId" UUID;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Member_headOfHouseholdId_fkey'
  ) THEN
    ALTER TABLE "Member"
      ADD CONSTRAINT "Member_headOfHouseholdId_fkey"
      FOREIGN KEY ("headOfHouseholdId") REFERENCES "Member"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- ActivityLog (sudah ada di dev DB)
CREATE TABLE IF NOT EXISTS "ActivityLog" (
  "id"         UUID        NOT NULL,
  "actorId"    UUID,
  "actorName"  TEXT,
  "actorEmail" TEXT,
  "action"     TEXT        NOT NULL,
  "entity"     TEXT        NOT NULL,
  "entityId"   TEXT,
  "summary"    TEXT        NOT NULL,
  "before"     JSONB,
  "after"      JSONB,
  "createdAt"  TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);
