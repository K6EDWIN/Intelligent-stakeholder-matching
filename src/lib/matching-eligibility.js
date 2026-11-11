import { availabilityDoesNotConflict } from "./availability";

const canMentor = (role) => role === "MENTOR" || role === "BOTH";
const canLearn = (role) => role === "MENTEE" || role === "BOTH";

export function rolesCanFormMentorship(ownerRole, candidateRole) {
  // Missing role data remains eligible for cold start; known incompatible
  // choices are excluded so recommendations do not invite two mentors or
  // two mentees into a mentorship pairing.
  if (!ownerRole || !candidateRole) return true;
  return (canMentor(ownerRole) && canLearn(candidateRole)) ||
    (canLearn(ownerRole) && canMentor(candidateRole));
}

export function isEligibleMentorshipMatch(owner, candidate) {
  return rolesCanFormMentorship(owner?.mentorshipRole, candidate?.mentorshipRole) &&
    availabilityDoesNotConflict(owner?.availability, candidate?.availability);
}
