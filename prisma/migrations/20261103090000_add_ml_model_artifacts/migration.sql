CREATE TYPE "MLModelType" AS ENUM ('ACCEPTANCE', 'RELEVANCE', 'NCF');

CREATE TABLE "MLModelArtifact" (
    "id" TEXT NOT NULL,
    "type" "MLModelType" NOT NULL,
    "version" TEXT NOT NULL,
    "featureNames" JSONB NOT NULL,
    "weights" JSONB NOT NULL,
    "bias" DOUBLE PRECISION NOT NULL,
    "sampleCount" INTEGER NOT NULL,
    "positiveCount" INTEGER NOT NULL,
    "negativeCount" INTEGER NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metrics" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MLModelArtifact_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MLModelArtifact_type_active_createdAt_idx" ON "MLModelArtifact"("type", "active", "createdAt");
