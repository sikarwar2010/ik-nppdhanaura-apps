-- Separate rebate and penalty rules per tax category, record the charge
-- breakdown used when a demand is published, and keep reversal details on
-- the payment. Additive only: existing policies become COMBINED and keep
-- their current behaviour. Rollback: see rollback.sql in this folder.

-- CreateEnum
CREATE TYPE "TaxCategory" AS ENUM ('COMBINED', 'PROPERTY_TAX', 'WATER_TAX', 'DRAINAGE_TAX');

-- AlterTable
ALTER TABLE "payment" ADD COLUMN     "reversalReason" TEXT,
ADD COLUMN     "reversedAt" TIMESTAMP(3),
ADD COLUMN     "reversedById" TEXT;

-- AlterTable
ALTER TABLE "rebate_policy" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "taxCategory" "TaxCategory" NOT NULL DEFAULT 'COMBINED';

-- AlterTable
ALTER TABLE "penalty_policy" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "taxCategory" "TaxCategory" NOT NULL DEFAULT 'COMBINED';

-- AlterTable
ALTER TABLE "assessment_demand" ADD COLUMN     "chargeBreakdown" JSONB;

-- CreateIndex
CREATE INDEX "rebate_policy_assessmentYearId_taxCategory_status_idx" ON "rebate_policy"("assessmentYearId", "taxCategory", "status");

-- CreateIndex
CREATE INDEX "penalty_policy_assessmentYearId_taxCategory_status_idx" ON "penalty_policy"("assessmentYearId", "taxCategory", "status");

-- One ACTIVE rule per year *and tax category* (was: per year). COMBINED is
-- its own category; the service keeps COMBINED and per-tax rules exclusive.
DROP INDEX IF EXISTS "rebate_policy_one_active";
CREATE UNIQUE INDEX "rebate_policy_one_active" ON "rebate_policy"("assessmentYearId", "taxCategory") WHERE "status" = 'ACTIVE';
DROP INDEX IF EXISTS "penalty_policy_one_active";
CREATE UNIQUE INDEX "penalty_policy_one_active" ON "penalty_policy"("assessmentYearId", "taxCategory") WHERE "status" = 'ACTIVE';

-- Backfill reversal details for payments reversed before this migration,
-- from the PAYMENT_REVERSED audit rows (reason, actor, time).
UPDATE "payment" p
SET "reversedAt" = a."createdAt",
    "reversedById" = a."actorId",
    "reversalReason" = a."newValue"->>'reason'
FROM (
  SELECT DISTINCT ON ("entityId") "entityId", "createdAt", "actorId", "newValue"
  FROM "audit_log"
  WHERE "action" = 'PAYMENT_REVERSED' AND "entity" = 'Payment'
  ORDER BY "entityId", "createdAt" DESC
) a
WHERE p."id" = a."entityId" AND p."reversedAt" IS NULL;
