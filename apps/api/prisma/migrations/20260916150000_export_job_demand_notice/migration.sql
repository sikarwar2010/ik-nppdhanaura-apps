-- Extend export_job for async Property Tax Demand Notice PDF generation.
ALTER TABLE "export_job" ADD COLUMN IF NOT EXISTS "jobType" TEXT;
ALTER TABLE "export_job" ADD COLUMN IF NOT EXISTS "errorFileKey" TEXT;
ALTER TABLE "export_job" ADD COLUMN IF NOT EXISTS "processedCount" INTEGER;

CREATE INDEX IF NOT EXISTS "export_job_jobType_status_idx" ON "export_job"("jobType", "status");
