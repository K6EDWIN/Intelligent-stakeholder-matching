// Collaborative filtering utilities.
//
// User-based CF over accepted mentorship/connection interactions: two users
// are "similar" if they've connected with overlapping sets of people
// (Jaccard similarity over their accepted-connection sets, reusing the same
// jaccard() used for content-based filtering -- same math, different input
// sets). A candidate's collaborativeScore for the owner is a
// similarity-weighted vote from every other user who has connected with that
// candidate -- i.e. "people whose connection patterns look like yours also
// connected with this person" -- normalized to [0, 1] by total similarity so
// it stays comparable across owners with very different numbers of
// similar-enough peers.
//
// With only a handful of seeded interactions (see prisma/seed.cjs) most
// scores will be small or zero -- that's expected at this data scale, not a
// bug. The point of this module is the technique being demonstrably correct,
// not rich signal from ~10 users.

import { jaccard } from "./recommendation";

/**
 * @param {Map<string, Set<string>>} connectionsByUser userId -> set of
 *   userIds they have an ACCEPTED mentorship/connection with
 * @param {string} ownerId
 * @param {string} candidateId
 * @returns {number} collaborative similarity score between 0 and 1
 */
export function computeCollaborativeScore(connectionsByUser, ownerId, candidateId) {
  const ownerConnections = connectionsByUser.get(ownerId) || new Set();

  let weightedVotes = 0;
  let totalSimilarity = 0;

  for (const [otherId, otherConnections] of connectionsByUser) {
    if (otherId === ownerId) continue;

    const similarity = jaccard(ownerConnections, otherConnections);
    if (similarity === 0) continue;

    totalSimilarity += similarity;
    if (otherConnections.has(candidateId)) {
      weightedVotes += similarity;
    }
  }

  if (totalSimilarity === 0) return 0;
  return weightedVotes / totalSimilarity;
}

/**
 * Computes collaborative scores for a candidate set in one pass over users.
 * The original score has the same denominator for every candidate belonging
 * to an owner, so calculate peer similarity once instead of once per pair.
 * @param {Map<string, Set<string>>} connectionsByUser
 * @param {string} ownerId
 * @param {string[]} candidateIds
 * @returns {Map<string, number>}
 */
export function computeCollaborativeScores(connectionsByUser, ownerId, candidateIds) {
  const candidates = new Set(candidateIds);
  const weightedVotes = new Map(candidateIds.map((id) => [id, 0]));
  const ownerConnections = connectionsByUser.get(ownerId) || new Set();
  let totalSimilarity = 0;

  for (const [otherId, otherConnections] of connectionsByUser) {
    if (otherId === ownerId) continue;
    const similarity = jaccard(ownerConnections, otherConnections);
    if (similarity === 0) continue;
    totalSimilarity += similarity;
    for (const candidateId of otherConnections) {
      if (candidates.has(candidateId)) {
        weightedVotes.set(candidateId, weightedVotes.get(candidateId) + similarity);
      }
    }
  }

  return new Map(candidateIds.map((id) => [
    id,
    totalSimilarity ? weightedVotes.get(id) / totalSimilarity : 0,
  ]));
}

/**
 * Builds the connectionsByUser map from ACCEPTED MentorshipRequest and
 * ConnectionRequest rows. A connection is treated as undirected -- an
 * accepted request means both parties are now "connected," regardless of
 * who originally sent it.
 * @param {{ senderId: string, receiverId: string }[]} acceptedRequests
 * @returns {Map<string, Set<string>>}
 */
export function buildConnectionsByUser(acceptedRequests) {
  const map = new Map();

  const add = (a, b) => {
    if (!map.has(a)) map.set(a, new Set());
    map.get(a).add(b);
  };

  for (const { senderId, receiverId } of acceptedRequests) {
    add(senderId, receiverId);
    add(receiverId, senderId);
  }

  return map;
}
