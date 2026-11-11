CREATE TYPE "MentorshipTopicDirection" AS ENUM ('SEEKING', 'OFFERING');

CREATE TABLE "ProfileMentorshipTopic" (
    "profileId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "direction" "MentorshipTopicDirection" NOT NULL,

    CONSTRAINT "ProfileMentorshipTopic_pkey" PRIMARY KEY ("profileId", "skillId", "direction")
);

CREATE INDEX "ProfileMentorshipTopic_skillId_direction_idx"
    ON "ProfileMentorshipTopic"("skillId", "direction");

ALTER TABLE "ProfileMentorshipTopic"
    ADD CONSTRAINT "ProfileMentorshipTopic_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProfileMentorshipTopic"
    ADD CONSTRAINT "ProfileMentorshipTopic_skillId_fkey"
    FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MentorshipRequest" ADD COLUMN "completedAt" TIMESTAMP(3);
ALTER TABLE "MentorshipRequest" ADD COLUMN "recommendationId" TEXT;
CREATE INDEX "MentorshipRequest_recommendationId_idx" ON "MentorshipRequest"("recommendationId");
ALTER TABLE "MentorshipRequest"
    ADD CONSTRAINT "MentorshipRequest_recommendationId_fkey"
    FOREIGN KEY ("recommendationId") REFERENCES "Recommendation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RecommendationEvent" ADD COLUMN "policy" TEXT;
ALTER TABLE "RecommendationEvent" ADD COLUMN "selectionProbability" DOUBLE PRECISION;
