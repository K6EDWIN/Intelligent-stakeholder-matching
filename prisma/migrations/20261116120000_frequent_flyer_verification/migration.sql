CREATE TYPE "FrequentFlyerVerificationStatus" AS ENUM ('PENDING', 'RECORDS_MATCHED', 'NOT_CONFIRMED');

CREATE TABLE "FrequentFlyerVerification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reviewerId" TEXT,
    "evidenceCiphertext" TEXT NOT NULL,
    "status" "FrequentFlyerVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FrequentFlyerVerification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FrequentFlyerVerification_userId_key" ON "FrequentFlyerVerification"("userId");
CREATE INDEX "FrequentFlyerVerification_status_createdAt_idx" ON "FrequentFlyerVerification"("status", "createdAt");

ALTER TABLE "FrequentFlyerVerification"
ADD CONSTRAINT "FrequentFlyerVerification_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FrequentFlyerVerification"
ADD CONSTRAINT "FrequentFlyerVerification_reviewerId_fkey"
FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
