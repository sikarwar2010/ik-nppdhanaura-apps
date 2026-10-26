-- Manual rollback for 20261026120000_tax_category_policies_and_reversal.
-- Run only before any category-specific policy (taxCategory <> 'COMBINED')
-- has been activated; otherwise those rules would silently become COMBINED
-- (and restoring the per-year one-active index would fail).
-- Afterwards delete the row from "_prisma_migrations" for this migration.
DROP INDEX IF EXISTS "rebate_policy_one_active";
CREATE UNIQUE INDEX "rebate_policy_one_active" ON "rebate_policy"("assessmentYearId") WHERE "status" = 'ACTIVE';
DROP INDEX IF EXISTS "penalty_policy_one_active";
CREATE UNIQUE INDEX "penalty_policy_one_active" ON "penalty_policy"("assessmentYearId") WHERE "status" = 'ACTIVE';
DROP INDEX IF EXISTS "penalty_policy_assessmentYearId_taxCategory_status_idx";
DROP INDEX IF EXISTS "rebate_policy_assessmentYearId_taxCategory_status_idx";
ALTER TABLE "assessment_demand" DROP COLUMN IF EXISTS "chargeBreakdown";
ALTER TABLE "penalty_policy" DROP COLUMN IF EXISTS "taxCategory", DROP COLUMN IF EXISTS "createdById";
ALTER TABLE "rebate_policy" DROP COLUMN IF EXISTS "taxCategory", DROP COLUMN IF EXISTS "createdById";
ALTER TABLE "payment" DROP COLUMN IF EXISTS "reversalReason", DROP COLUMN IF EXISTS "reversedById", DROP COLUMN IF EXISTS "reversedAt";
DROP TYPE IF EXISTS "TaxCategory";
