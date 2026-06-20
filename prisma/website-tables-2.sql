-- Idempotent DDL for the About-page / Staff / FAQ additions.
-- Matches prisma/schema.prisma so a later `prisma db push` is a no-op.

-- Staff: public-website fields
ALTER TABLE "Staff" ADD COLUMN IF NOT EXISTS "showOnWebsite" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Staff" ADD COLUMN IF NOT EXISTS "websiteBio" TEXT;
ALTER TABLE "Staff" ADD COLUMN IF NOT EXISTS "websiteOrder" INTEGER NOT NULL DEFAULT 0;

-- SiteTheme: About-page prose
ALTER TABLE "SiteTheme" ADD COLUMN IF NOT EXISTS "aboutHistory" TEXT;
ALTER TABLE "SiteTheme" ADD COLUMN IF NOT EXISTS "missionText" TEXT;
ALTER TABLE "SiteTheme" ADD COLUMN IF NOT EXISTS "visionText" TEXT;

-- FAQ table
CREATE TABLE IF NOT EXISTS "Faq" (
  "id"        TEXT NOT NULL,
  "schoolId"  TEXT NOT NULL,
  "question"  TEXT NOT NULL,
  "answer"    TEXT NOT NULL,
  "category"  TEXT NOT NULL DEFAULT 'GENERAL',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive"  BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Faq_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Faq_schoolId_isActive_idx" ON "Faq" ("schoolId", "isActive");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Faq_schoolId_fkey') THEN
    ALTER TABLE "Faq" ADD CONSTRAINT "Faq_schoolId_fkey"
      FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
