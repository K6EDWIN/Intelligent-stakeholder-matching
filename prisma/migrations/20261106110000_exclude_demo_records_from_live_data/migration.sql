ALTER TABLE "User"
ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false;

-- The bundled demonstration CSV uses example.com addresses. Mark existing
-- seeded accounts so they cannot appear in live discovery or train live models.
UPDATE "User"
SET "isDemo" = true
WHERE lower("email") LIKE '%@example.com';

-- Existing artifacts have no recorded training-data provenance. Require a
-- fresh publish from the filtered live-data export before using model weights.
UPDATE "MLModelArtifact"
SET "active" = false;
