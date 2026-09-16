// Combines content-based and collaborative scores into a single ranking
// score, per the proposal's weighted hybrid formula:
//
//   hybridScore = (alpha * contentScore) + (beta * collaborativeScore)
//   where alpha + beta = 1
//
// alpha/beta aren't fixed -- they shift with how much interaction data the
// platform has accumulated, to handle cold start. Early on (few accepted
// mentorship/connection requests), collaborative filtering has almost
// nothing to work with, so content similarity should dominate. As more
// requests get accepted, collaborative signal becomes more trustworthy and
// its weight grows -- but never past MAX beta, since profile-based matching
// stays a meaningful signal even at scale, not something CF should fully
// replace.
//
// SATURATION_POINT is the number of accepted interactions at which beta
// maxes out. It's a placeholder tuned for this platform's current tiny
// seeded dataset (~7 accepted interactions, see prisma/seed.cjs) -- revisit
// once real usage data exists.

const MIN_ALPHA = 0.5;
const MAX_ALPHA = 0.9;
const SATURATION_POINT = 50;

/**
 * @param {number} totalAcceptedInteractions count of ACCEPTED mentorship +
 *   connection requests platform-wide
 * @returns {{ alpha: number, beta: number }}
 */
export function computeHybridWeights(totalAcceptedInteractions) {
  const progress = Math.min(
    Math.max(totalAcceptedInteractions, 0) / SATURATION_POINT,
    1
  );
  const alpha = MAX_ALPHA - progress * (MAX_ALPHA - MIN_ALPHA);
  return { alpha, beta: 1 - alpha };
}

/**
 * @param {number} contentScore
 * @param {number} collaborativeScore
 * @param {{ alpha: number, beta: number }} weights
 * @returns {number} hybrid score between 0 and 1
 */
export function computeHybridScore(contentScore, collaborativeScore, weights) {
  return weights.alpha * contentScore + weights.beta * collaborativeScore;
}
