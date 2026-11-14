CREATE TYPE "FeedbackType" AS ENUM (
  'MATCH_RELEVANCE',
  'MENTORSHIP_USEFULNESS',
  'CONNECTION_USEFULNESS'
);

ALTER TABLE "Feedback"
ADD COLUMN "feedbackType" "FeedbackType" NOT NULL DEFAULT 'MATCH_RELEVANCE';

-- Preserve the meaning of existing post-interaction ratings. Remaining records
-- are treated as match relevance, matching the former recommendation-rating flow.
UPDATE "Feedback" AS feedback
SET "feedbackType" = CASE
  WHEN feedback."mentorshipRequestId" IS NOT NULL
    THEN 'MENTORSHIP_USEFULNESS'::"FeedbackType"
  WHEN feedback."connectionRequestId" IS NOT NULL
    THEN 'CONNECTION_USEFULNESS'::"FeedbackType"
  ELSE 'MATCH_RELEVANCE'::"FeedbackType"
END;

CREATE INDEX "Feedback_feedbackType_createdAt_idx"
ON "Feedback"("feedbackType", "createdAt");

CREATE INDEX "Feedback_recommendationId_userId_feedbackType_idx"
ON "Feedback"("recommendationId", "userId", "feedbackType");
