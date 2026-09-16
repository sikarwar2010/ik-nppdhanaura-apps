-- Additive only: Mainpuri GIS "Property Type" column (Residential / Mix / Commercial / Open Land).
-- Does not rewrite existing survey rows.
ALTER TABLE "Survey" ADD COLUMN IF NOT EXISTS "propertyType" TEXT;
