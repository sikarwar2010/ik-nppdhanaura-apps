-- CreateEnum
CREATE TYPE "AssessmentYearLifecycle" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PolicyStatus" AS ENUM ('DRAFT', 'ACTIVE', 'EXPIRED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RebateType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "PenaltyType" AS ENUM ('PERCENT_OF_PROPERTY_TAX', 'PERCENT_OF_ELIGIBLE_BASE', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "PenaltyTrigger" AS ENUM ('ON_ASSESSMENT', 'DUE_DATE_PASSED');

-- CreateEnum
CREATE TYPE "DemandVerificationStatus" AS ENUM ('UNVERIFIED', 'VERIFIED');

-- CreateEnum
CREATE TYPE "DemandBalanceKind" AS ENUM ('COMPONENTS', 'CLOSING_ONLY');

-- CreateTable
CREATE TABLE "assessment_year_profile" (
    "id" TEXT NOT NULL,
    "referenceEntryId" TEXT NOT NULL,
    "startsOn" DATE NOT NULL,
    "endsOn" DATE NOT NULL,
    "status" "AssessmentYearLifecycle" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_year_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rebate_policy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "assessmentYearId" TEXT NOT NULL,
    "rebateType" "RebateType" NOT NULL,
    "rate" DECIMAL(8,4),
    "fixedAmount" DECIMAL(14,2),
    "includePropertyTax" BOOLEAN NOT NULL DEFAULT true,
    "includeWaterTax" BOOLEAN NOT NULL DEFAULT true,
    "includeDrainageTax" BOOLEAN NOT NULL DEFAULT true,
    "includeArrears" BOOLEAN NOT NULL DEFAULT true,
    "includePenalty" BOOLEAN NOT NULL DEFAULT false,
    "includeInterest" BOOLEAN NOT NULL DEFAULT false,
    "maxAmount" DECIMAL(14,2),
    "startsOn" DATE,
    "endsOn" DATE,
    "paymentDeadline" DATE,
    "status" "PolicyStatus" NOT NULL DEFAULT 'DRAFT',
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rebate_policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "penalty_policy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "assessmentYearId" TEXT NOT NULL,
    "penaltyType" "PenaltyType" NOT NULL,
    "rate" DECIMAL(8,4),
    "fixedAmount" DECIMAL(14,2),
    "trigger" "PenaltyTrigger" NOT NULL DEFAULT 'ON_ASSESSMENT',
    "graceDays" INTEGER NOT NULL DEFAULT 0,
    "dueDate" DATE,
    "includePropertyTax" BOOLEAN NOT NULL DEFAULT true,
    "includeWaterTax" BOOLEAN NOT NULL DEFAULT false,
    "includeDrainageTax" BOOLEAN NOT NULL DEFAULT false,
    "includeArrears" BOOLEAN NOT NULL DEFAULT false,
    "maxAmount" DECIMAL(14,2),
    "startsOn" DATE,
    "endsOn" DATE,
    "status" "PolicyStatus" NOT NULL DEFAULT 'DRAFT',
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "penalty_policy_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "assessment_demand" ADD COLUMN "rebateAmount" DECIMAL(14,2) NOT NULL DEFAULT 0;
ALTER TABLE "assessment_demand" ADD COLUMN "historicalPayments" DECIMAL(14,2) NOT NULL DEFAULT 0;
ALTER TABLE "assessment_demand" ADD COLUMN "rebatePolicyId" TEXT;
ALTER TABLE "assessment_demand" ADD COLUMN "penaltyPolicyId" TEXT;
ALTER TABLE "assessment_demand" ADD COLUMN "verificationStatus" "DemandVerificationStatus" NOT NULL DEFAULT 'VERIFIED';
ALTER TABLE "assessment_demand" ADD COLUMN "verifiedById" TEXT;
ALTER TABLE "assessment_demand" ADD COLUMN "verifiedAt" TIMESTAMP(3);
ALTER TABLE "assessment_demand" ADD COLUMN "sourceReference" TEXT;
ALTER TABLE "assessment_demand" ADD COLUMN "remarks" TEXT;
ALTER TABLE "assessment_demand" ADD COLUMN "balanceKind" "DemandBalanceKind" NOT NULL DEFAULT 'COMPONENTS';

-- CreateIndex
CREATE UNIQUE INDEX "assessment_year_profile_referenceEntryId_key" ON "assessment_year_profile"("referenceEntryId");

-- CreateIndex
CREATE INDEX "assessment_year_profile_status_idx" ON "assessment_year_profile"("status");

-- CreateIndex
CREATE INDEX "rebate_policy_assessmentYearId_status_idx" ON "rebate_policy"("assessmentYearId", "status");

-- One active rebate policy per assessment year.
CREATE UNIQUE INDEX "rebate_policy_one_active" ON "rebate_policy"("assessmentYearId") WHERE "status" = 'ACTIVE';

-- CreateIndex
CREATE INDEX "penalty_policy_assessmentYearId_status_idx" ON "penalty_policy"("assessmentYearId", "status");

-- One active penalty policy per assessment year.
CREATE UNIQUE INDEX "penalty_policy_one_active" ON "penalty_policy"("assessmentYearId") WHERE "status" = 'ACTIVE';

-- CreateIndex
CREATE INDEX "assessment_demand_rebatePolicyId_idx" ON "assessment_demand"("rebatePolicyId");

-- CreateIndex
CREATE INDEX "assessment_demand_penaltyPolicyId_idx" ON "assessment_demand"("penaltyPolicyId");

-- AddForeignKey
ALTER TABLE "assessment_year_profile" ADD CONSTRAINT "assessment_year_profile_referenceEntryId_fkey" FOREIGN KEY ("referenceEntryId") REFERENCES "reference_entry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rebate_policy" ADD CONSTRAINT "rebate_policy_assessmentYearId_fkey" FOREIGN KEY ("assessmentYearId") REFERENCES "reference_entry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rebate_policy" ADD CONSTRAINT "rebate_policy_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penalty_policy" ADD CONSTRAINT "penalty_policy_assessmentYearId_fkey" FOREIGN KEY ("assessmentYearId") REFERENCES "reference_entry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penalty_policy" ADD CONSTRAINT "penalty_policy_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_demand" ADD CONSTRAINT "assessment_demand_rebatePolicyId_fkey" FOREIGN KEY ("rebatePolicyId") REFERENCES "rebate_policy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_demand" ADD CONSTRAINT "assessment_demand_penaltyPolicyId_fkey" FOREIGN KEY ("penaltyPolicyId") REFERENCES "penalty_policy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_demand" ADD CONSTRAINT "assessment_demand_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
