ALTER TABLE "Recommendation"
ADD COLUMN "semanticScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "modelFeatures" JSONB;

ALTER TABLE "Feedback"
ADD COLUMN "modelFeatures" JSONB;
