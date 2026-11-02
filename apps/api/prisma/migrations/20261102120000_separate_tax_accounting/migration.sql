-- Separate tax accounting: each allocation records how much went to each tax.
-- Existing rows stay NULL ("not split"); the engine settles those first in the
-- existing order, so no balance changes when this migration runs.
ALTER TABLE "payment_allocation"
  ADD COLUMN "propertyTaxAmount" DECIMAL(14,2),
  ADD COLUMN "waterTaxAmount" DECIMAL(14,2),
  ADD COLUMN "drainageTaxAmount" DECIMAL(14,2),
  ADD COLUMN "chargesAmount" DECIMAL(14,2),
  ADD COLUMN "historicalAmount" DECIMAL(14,2);

-- Either not split at all, or split with parts that add up exactly to the amount.
ALTER TABLE "payment_allocation" ADD CONSTRAINT "payment_allocation_tax_split_sum" CHECK (
  ("propertyTaxAmount" IS NULL AND "waterTaxAmount" IS NULL AND "drainageTaxAmount" IS NULL
    AND "chargesAmount" IS NULL AND "historicalAmount" IS NULL)
  OR (COALESCE("propertyTaxAmount", 0) + COALESCE("waterTaxAmount", 0) + COALESCE("drainageTaxAmount", 0)
    + COALESCE("chargesAmount", 0) + COALESCE("historicalAmount", 0) = "amount")
);

-- What the clerk or citizen chose to pay, kept until the payment settles
-- (a cheque waiting to clear, or an online payment waiting for the gateway).
ALTER TABLE "payment" ADD COLUMN "taxPlan" JSONB;

-- A credit or debit may name the tax it belongs to.
ALTER TABLE "demand_adjustment" ADD COLUMN "taxBucket" TEXT;

-- Outbox for public statistics. Written in the same transaction as the payment.
CREATE TYPE "PublicSyncStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

CREATE TABLE "public_sync_event" (
  "id" TEXT NOT NULL,
  "dedupeKey" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "paymentId" TEXT,
  "wardId" TEXT,
  "status" "PublicSyncStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastError" TEXT,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "public_sync_event_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "public_sync_event_dedupeKey_key" ON "public_sync_event"("dedupeKey");
CREATE INDEX "public_sync_event_status_nextAttemptAt_idx" ON "public_sync_event"("status", "nextAttemptAt");
CREATE INDEX "public_sync_event_createdAt_idx" ON "public_sync_event"("createdAt");

-- Production reset runs. Never deleted, including by a reset.
CREATE TYPE "ProductionResetStatus" AS ENUM ('PREPARED', 'BACKUP_VERIFIED', 'AWAITING_APPROVAL', 'APPROVED', 'EXECUTED', 'FAILED', 'CANCELLED');

CREATE TABLE "production_reset_run" (
  "id" TEXT NOT NULL,
  "status" "ProductionResetStatus" NOT NULL DEFAULT 'PREPARED',
  "scope" JSONB NOT NULL,
  "paymentIds" JSONB NOT NULL,
  "counts" JSONB NOT NULL,
  "scopeHash" TEXT NOT NULL,
  "backupKey" TEXT,
  "backupSha256" TEXT,
  "backupBytes" INTEGER,
  "backupVerifiedAt" TIMESTAMP(3),
  "reason" TEXT,
  "requestedById" TEXT NOT NULL,
  "approvedById" TEXT,
  "executedById" TEXT,
  "executedAt" TIMESTAMP(3),
  "report" JSONB,
  "failure" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "production_reset_run_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "production_reset_run_status_idx" ON "production_reset_run"("status");
CREATE INDEX "production_reset_run_createdAt_idx" ON "production_reset_run"("createdAt");

-- Super Admin only. Not granted to any other role.
INSERT INTO "permission" ("id", "code", "resource", "action", "description", "createdAt", "updatedAt")
VALUES (
  'perm_system_production_reset',
  'system:production-reset',
  'system',
  'production-reset',
  'Clear approved test transactions before go-live',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("code") DO NOTHING;
