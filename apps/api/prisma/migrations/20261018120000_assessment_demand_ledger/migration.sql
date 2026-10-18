-- CreateEnum
CREATE TYPE "AssessmentDemandStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "AssessmentDemandSource" AS ENUM ('CALCULATED', 'OPENING_BALANCE');

-- CreateEnum
CREATE TYPE "PaymentAllocationStatus" AS ENUM ('ACTIVE', 'REVERSED');

-- CreateEnum
CREATE TYPE "DemandAdjustmentKind" AS ENUM ('CREDIT', 'DEBIT');

-- CreateTable
CREATE TABLE "assessment_demand" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "wardId" TEXT NOT NULL,
    "assessmentYearId" TEXT NOT NULL,
    "taxConfigId" TEXT,
    "taxConfigVersion" INTEGER,
    "demandReference" TEXT NOT NULL,
    "status" "AssessmentDemandStatus" NOT NULL DEFAULT 'PUBLISHED',
    "source" "AssessmentDemandSource" NOT NULL,
    "propertyTax" DECIMAL(14,2) NOT NULL,
    "waterTax" DECIMAL(14,2) NOT NULL,
    "drainageTax" DECIMAL(14,2) NOT NULL,
    "penalty" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "interest" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currentYearDemand" DECIMAL(14,2) NOT NULL,
    "openingArrears" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "idempotencyKey" TEXT,
    "publishedAt" TIMESTAMP(3),
    "publishedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_demand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demand_notice_issue" (
    "id" TEXT NOT NULL,
    "assessmentDemandId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "fileKey" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedById" TEXT,

    CONSTRAINT "demand_notice_issue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_allocation" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "assessmentDemandId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "status" "PaymentAllocationStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reversedAt" TIMESTAMP(3),

    CONSTRAINT "payment_allocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demand_adjustment" (
    "id" TEXT NOT NULL,
    "assessmentDemandId" TEXT NOT NULL,
    "kind" "DemandAdjustmentKind" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "createdById" TEXT,
    "reversesAdjustmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demand_adjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "assessment_demand_demandReference_key" ON "assessment_demand"("demandReference");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_demand_idempotencyKey_key" ON "assessment_demand"("idempotencyKey");

-- One published demand per property and assessment year. Revisions use SUPERSEDED.
CREATE UNIQUE INDEX "assessment_demand_one_published" ON "assessment_demand"("surveyId", "assessmentYearId") WHERE "status" = 'PUBLISHED';

-- CreateIndex
CREATE INDEX "assessment_demand_surveyId_status_idx" ON "assessment_demand"("surveyId", "status");

-- CreateIndex
CREATE INDEX "assessment_demand_surveyId_assessmentYearId_status_idx" ON "assessment_demand"("surveyId", "assessmentYearId", "status");

-- CreateIndex
CREATE INDEX "assessment_demand_wardId_assessmentYearId_idx" ON "assessment_demand"("wardId", "assessmentYearId");

-- CreateIndex
CREATE UNIQUE INDEX "demand_notice_issue_assessmentDemandId_version_key" ON "demand_notice_issue"("assessmentDemandId", "version");

-- CreateIndex
CREATE INDEX "demand_notice_issue_assessmentDemandId_idx" ON "demand_notice_issue"("assessmentDemandId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_allocation_paymentId_assessmentDemandId_key" ON "payment_allocation"("paymentId", "assessmentDemandId");

-- CreateIndex
CREATE INDEX "payment_allocation_assessmentDemandId_status_idx" ON "payment_allocation"("assessmentDemandId", "status");

-- CreateIndex
CREATE INDEX "payment_allocation_paymentId_status_idx" ON "payment_allocation"("paymentId", "status");

-- CreateIndex
CREATE INDEX "demand_adjustment_assessmentDemandId_idx" ON "demand_adjustment"("assessmentDemandId");

-- AddForeignKey
ALTER TABLE "assessment_demand" ADD CONSTRAINT "assessment_demand_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "survey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_demand" ADD CONSTRAINT "assessment_demand_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "ward"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_demand" ADD CONSTRAINT "assessment_demand_assessmentYearId_fkey" FOREIGN KEY ("assessmentYearId") REFERENCES "reference_entry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_demand" ADD CONSTRAINT "assessment_demand_taxConfigId_fkey" FOREIGN KEY ("taxConfigId") REFERENCES "tax_config"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_demand" ADD CONSTRAINT "assessment_demand_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demand_notice_issue" ADD CONSTRAINT "demand_notice_issue_assessmentDemandId_fkey" FOREIGN KEY ("assessmentDemandId") REFERENCES "assessment_demand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demand_notice_issue" ADD CONSTRAINT "demand_notice_issue_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_allocation" ADD CONSTRAINT "payment_allocation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_allocation" ADD CONSTRAINT "payment_allocation_assessmentDemandId_fkey" FOREIGN KEY ("assessmentDemandId") REFERENCES "assessment_demand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_allocation" ADD CONSTRAINT "payment_allocation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demand_adjustment" ADD CONSTRAINT "demand_adjustment_assessmentDemandId_fkey" FOREIGN KEY ("assessmentDemandId") REFERENCES "assessment_demand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demand_adjustment" ADD CONSTRAINT "demand_adjustment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demand_adjustment" ADD CONSTRAINT "demand_adjustment_reversesAdjustmentId_fkey" FOREIGN KEY ("reversesAdjustmentId") REFERENCES "demand_adjustment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
