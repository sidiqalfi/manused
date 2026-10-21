-- Add unique slug column to Kegiatan for shareable URLs.
-- Slug is generated once (create or manual edit); renames do NOT change it.
-- Backfill: pure name slug; ties broken by -2, -3, ... in id order.

ALTER TABLE "Kegiatan" ADD COLUMN "slug" TEXT;

WITH ranked AS (
  SELECT
    id,
    substring(
      regexp_replace(
        regexp_replace(
          regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'),
          '^-+', '', ''),
        '-+$', '', ''),
      1, 40
    ) AS base,
    ROW_NUMBER() OVER (PARTITION BY substring(
      regexp_replace(
        regexp_replace(
          regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'),
          '^-+', '', ''),
        '-+$', '', ''),
      1, 40
    ) ORDER BY "createdAt", id) AS rn
  FROM "Kegiatan"
)
UPDATE "Kegiatan" SET "slug" = CASE
  WHEN base IS NULL OR base = '' THEN
    CASE WHEN rn = 1 THEN 'kegiatan' ELSE 'kegiatan-' || rn END
  WHEN rn = 1 THEN base
  ELSE base || '-' || rn
END
FROM ranked WHERE ranked.id = "Kegiatan"."id";

ALTER TABLE "Kegiatan" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "Kegiatan_slug_key" ON "Kegiatan"("slug");
