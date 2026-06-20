-- Idempotent DDL for the public-website models (Partner, SiteTheme, Faq)
-- plus the Staff "Our team" website columns.
-- Matches prisma/schema.prisma exactly so a later `prisma db push` is a no-op.

CREATE TABLE IF NOT EXISTS "Partner" (
  "id"          TEXT NOT NULL,
  "schoolId"    TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "logoUrl"     TEXT,
  "websiteUrl"  TEXT,
  "category"    TEXT NOT NULL DEFAULT 'PARTNER',
  "sortOrder"   INTEGER NOT NULL DEFAULT 0,
  "isActive"    BOOLEAN NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Partner_schoolId_isActive_idx" ON "Partner" ("schoolId", "isActive");

CREATE TABLE IF NOT EXISTS "SiteTheme" (
  "id"                 TEXT NOT NULL,
  "schoolId"           TEXT NOT NULL,
  "primaryColor"       TEXT NOT NULL DEFAULT '#047857',
  "secondaryColor"     TEXT NOT NULL DEFAULT '#0f766e',
  "accentColor"        TEXT NOT NULL DEFAULT '#facc15',
  "darkColor"          TEXT NOT NULL DEFAULT '#022c22',
  "headingFont"        TEXT NOT NULL DEFAULT 'Geist',
  "bodyFont"           TEXT NOT NULL DEFAULT 'Geist',
  "radius"             TEXT NOT NULL DEFAULT '0.75rem',
  "heroImageUrl"       TEXT NOT NULL DEFAULT '/images/campus-hero.jpg',
  "heroBadge"          TEXT,
  "heroHeadline"       TEXT,
  "heroMotto"          TEXT,
  "heroSubtitle"       TEXT,
  "heroPrimaryLabel"   TEXT NOT NULL DEFAULT 'Apply for Admission',
  "heroPrimaryHref"    TEXT NOT NULL DEFAULT '/admissions/apply',
  "heroSecondaryLabel" TEXT NOT NULL DEFAULT 'Discover Our School',
  "heroSecondaryHref"  TEXT NOT NULL DEFAULT '/about',
  "overlayFrom"        TEXT NOT NULL DEFAULT '#022c22',
  "overlayTo"          TEXT NOT NULL DEFAULT '#134e4a',
  "overlayOpacity"     INTEGER NOT NULL DEFAULT 80,
  "statsJson"          TEXT NOT NULL DEFAULT '[]',
  "valuesJson"         TEXT NOT NULL DEFAULT '[]',
  "testimonialsJson"   TEXT NOT NULL DEFAULT '[]',
  "showStats"          BOOLEAN NOT NULL DEFAULT true,
  "showPartners"       BOOLEAN NOT NULL DEFAULT true,
  "showValues"         BOOLEAN NOT NULL DEFAULT true,
  "showGallery"        BOOLEAN NOT NULL DEFAULT true,
  "showTestimonials"   BOOLEAN NOT NULL DEFAULT true,
  "showNews"           BOOLEAN NOT NULL DEFAULT true,
  "showEvents"         BOOLEAN NOT NULL DEFAULT true,
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SiteTheme_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SiteTheme_schoolId_key" ON "SiteTheme" ("schoolId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Partner_schoolId_fkey') THEN
    ALTER TABLE "Partner" ADD CONSTRAINT "Partner_schoolId_fkey"
      FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SiteTheme_schoolId_fkey') THEN
    ALTER TABLE "SiteTheme" ADD CONSTRAINT "SiteTheme_schoolId_fkey"
      FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
