ALTER TABLE "Opportunity"
  ADD COLUMN "sourceUrl" TEXT,
  ADD COLUMN "expiresAt" TIMESTAMP(3),
  ADD COLUMN "division" TEXT,
  ADD COLUMN "employmentType" TEXT;

CREATE INDEX "Opportunity_expiresAt_idx" ON "Opportunity"("expiresAt");
