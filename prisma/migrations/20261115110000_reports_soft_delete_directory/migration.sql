CREATE TYPE "ReportTargetType" AS ENUM ('USER', 'OPPORTUNITY', 'EVENT');
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'ACTIONED', 'DISMISSED');

ALTER TABLE "User"
ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "deletedAt" TIMESTAMP(3);

ALTER TABLE "Opportunity"
ADD COLUMN "isHidden" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Event"
ADD COLUMN "isHidden" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "targetType" "ReportTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" VARCHAR(1000),
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "moderatorId" TEXT,
    "moderatorNote" VARCHAR(1000),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Report_status_createdAt_idx" ON "Report"("status", "createdAt");
CREATE INDEX "Report_targetType_targetId_idx" ON "Report"("targetType", "targetId");

ALTER TABLE "Report"
ADD CONSTRAINT "Report_reporterId_fkey"
FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Report"
ADD CONSTRAINT "Report_moderatorId_fkey"
FOREIGN KEY ("moderatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
