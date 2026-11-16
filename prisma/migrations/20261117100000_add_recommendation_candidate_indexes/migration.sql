CREATE INDEX IF NOT EXISTS "Profile_isPublic_department_idx"
  ON "Profile"("isPublic", "department");

CREATE INDEX IF NOT EXISTS "ProfileSkill_skillId_idx"
  ON "ProfileSkill"("skillId");

CREATE INDEX IF NOT EXISTS "ProfileInterest_interestId_idx"
  ON "ProfileInterest"("interestId");
