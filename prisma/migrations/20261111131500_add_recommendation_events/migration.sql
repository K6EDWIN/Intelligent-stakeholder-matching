CREATE TABLE "RecommendationEvent" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "rank" INTEGER,
    "scores" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecommendationEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RecommendationEvent_ownerId_eventType_createdAt_idx"
    ON "RecommendationEvent"("ownerId", "eventType", "createdAt");
CREATE INDEX "RecommendationEvent_recommendationId_eventType_createdAt_idx"
    ON "RecommendationEvent"("recommendationId", "eventType", "createdAt");

ALTER TABLE "RecommendationEvent"
    ADD CONSTRAINT "RecommendationEvent_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecommendationEvent"
    ADD CONSTRAINT "RecommendationEvent_recommendationId_fkey"
    FOREIGN KEY ("recommendationId") REFERENCES "Recommendation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
