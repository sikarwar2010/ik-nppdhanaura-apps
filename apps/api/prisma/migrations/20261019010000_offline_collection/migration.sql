-- AlterTable
ALTER TABLE "penalty_policy" ADD COLUMN "applyAfterRebate" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "payment" ADD COLUMN "counterCode" TEXT;
ALTER TABLE "payment" ADD COLUMN "idempotencyKey" TEXT;
ALTER TABLE "payment" ADD COLUMN "receiptSnapshot" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "payment_idempotencyKey_key" ON "payment"("idempotencyKey");
CREATE INDEX "payment_collectionDate_idx" ON "payment"("collectionDate");

-- CreateTable
CREATE TABLE "receipt_sequence" (
    "yearCode" TEXT NOT NULL,
    "lastValue" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "receipt_sequence_pkey" PRIMARY KEY ("yearCode")
);

-- Grant offline collection to existing cashier roles. Seed also upserts this permission.
INSERT INTO "permission" ("id", "code", "resource", "action", "description", "createdAt", "updatedAt")
VALUES (
    'perm_payment_collect',
    'payment:collect',
    'payment',
    'collect',
    'Collect offline property tax and issue a receipt',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "role_permission" ("id", "roleId", "permissionId", "createdAt")
SELECT
    'rp_' || r."code" || '_payment_collect',
    r."id",
    p."id",
    CURRENT_TIMESTAMP
FROM "role" r
JOIN "permission" p ON p."code" = 'payment:collect'
WHERE r."code" IN ('CLERK', 'DEPARTMENT_ADMIN')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
