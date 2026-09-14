// Content-based filtering utilities.
//
// Similarity between two stakeholders is computed as a weighted combination
// of Jaccard similarity over their skill sets and their interest sets:
//
//   contentScore = (0.6 * skillJaccard) + (0.4 * interestJaccard)
//
// Skills are weighted higher than interests because they're a stronger
// signal of mentorship/professional fit (per the proposal's emphasis on
// skills, professional background, and mentorship goals). Jaccard is used
// because it's simple, well-understood, and works well on small,
// unweighted attribute sets like these -- exactly the "cold start"
// situation described in the proposal, where interaction data isn't
// available yet but profile data is.

const SKILL_WEIGHT = 0.6;
const INTEREST_WEIGHT = 0.4;

export function jaccard(setA, setB) {
  if (setA.size === 0 && setB.size === 0) return 0;

  let intersectionSize = 0;
  for (const item of setA) {
    if (setB.has(item)) intersectionSize++;
  }

  const unionSize = new Set([...setA, ...setB]).size;
  if (unionSize === 0) return 0;

  return intersectionSize / unionSize;
}

/**
 * @param {{ skillIds: string[], interestIds: string[] }} profileA
 * @param {{ skillIds: string[], interestIds: string[] }} profileB
 * @returns {number} content-based similarity score between 0 and 1
 */
export function computeContentScore(profileA, profileB) {
  const skillsA = new Set(profileA.skillIds);
  const skillsB = new Set(profileB.skillIds);
  const interestsA = new Set(profileA.interestIds);
  const interestsB = new Set(profileB.interestIds);

  const skillScore = jaccard(skillsA, skillsB);
  const interestScore = jaccard(interestsA, interestsB);

  return SKILL_WEIGHT * skillScore + INTEREST_WEIGHT * interestScore;
}

/** Returns the ids of skills/interests two profiles have in common, for
 * showing the user *why* someone was recommended. */
export function sharedAttributes(profileA, profileB) {
  const sharedSkillIds = profileA.skillIds.filter((id) =>
    profileB.skillIds.includes(id)
  );
  const sharedInterestIds = profileA.interestIds.filter((id) =>
    profileB.interestIds.includes(id)
  );
  return { sharedSkillIds, sharedInterestIds };
}
