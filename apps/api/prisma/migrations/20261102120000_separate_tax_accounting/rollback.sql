-- Run only before any tax-split payment has been posted: it discards the split.
DELETE FROM "role_permission" WHERE "permissionId" IN (SELECT id FROM "permission" WHERE code = 'system:production-reset');
DELETE FROM "permission" WHERE code = 'system:production-reset';
DROP TABLE IF EXISTS "production_reset_run";
DROP TYPE IF EXISTS "ProductionResetStatus";
DROP TABLE IF EXISTS "public_sync_event";
DROP TYPE IF EXISTS "PublicSyncStatus";
ALTER TABLE "demand_adjustment" DROP COLUMN IF EXISTS "taxBucket";
ALTER TABLE "payment" DROP COLUMN IF EXISTS "taxPlan";
ALTER TABLE "payment_allocation" DROP CONSTRAINT IF EXISTS "payment_allocation_tax_split_sum";
ALTER TABLE "payment_allocation"
  DROP COLUMN IF EXISTS "propertyTaxAmount",
  DROP COLUMN IF EXISTS "waterTaxAmount",
  DROP COLUMN IF EXISTS "drainageTaxAmount",
  DROP COLUMN IF EXISTS "chargesAmount",
  DROP COLUMN IF EXISTS "historicalAmount";
