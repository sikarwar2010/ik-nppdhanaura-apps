-- Additive only: Mainpuri GIS "Property Type" column (Residential / Mix / Commercial / Open Land).
-- Does not rewrite existing survey rows.
-- Table is @@map("survey") - quoted "Survey" fails on Postgres (relation does not exist).
ALTER TABLE "survey" ADD COLUMN IF NOT EXISTS "propertyType" TEXT;
