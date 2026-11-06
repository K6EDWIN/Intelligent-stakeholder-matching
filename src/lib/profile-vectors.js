// Small, transparent profile text vectors for the aviation vocabulary in this
// app. Tokens are normalized into domain concepts, then represented by a
// sparse bag-of-words/bigrams vector. This runs locally and sends no profile
// text to the hosted ML service.
const STOP_WORDS = new Set(["and", "the", "for", "with", "from", "your", "you", "our", "are", "has", "have", "was", "were", "into", "across", "about", "this", "that"]);
const DOMAIN_SYNONYMS = [
  ["flight operations", "flight ops", "air operations", "flight dispatch", "flight planning"],
  ["ground operations", "ground ops", "airport operations", "ramp operations", "ground handling"],
  ["cabin crew", "cabin services", "flight attendant", "inflight services"],
  ["customer experience", "customer service", "passenger experience", "guest experience"],
  ["safety management", "aviation safety", "safety assurance", "safety compliance"],
  ["engineering", "aircraft maintenance", "aircraft engineering", "maintenance engineering"],
  ["data analytics", "data analysis", "business intelligence", "data science"],
  ["leadership", "people management", "team leadership", "executive leadership"],
  ["project management", "program management", "project delivery"],
  ["mentorship", "coaching", "career guidance", "professional development"],
  ["revenue management", "yield management", "airline revenue"],
  ["network planning", "route planning", "airline network strategy"],
];

function normalizeText(value) {
  let text = String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  for (const [canonical, ...aliases] of DOMAIN_SYNONYMS) {
    for (const alias of [canonical, ...aliases]) {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      text = text.replace(new RegExp(`\\b${escaped}\\b`, "g"), canonical.replaceAll(" ", "_"));
    }
  }
  return text;
}

function profileTerms(profile) {
  const values = [
    profile?.department,
    profile?.bio,
    profile?.professionalBackground,
    profile?.trainingHistory,
    profile?.careerGoals,
    profile?.mentorshipNeeds,
    ...(profile?.skills || []).map((item) => item.skill?.name || item.name),
    ...(profile?.interests || []).map((item) => item.interest?.name || item.name),
  ];
  return normalizeText(values.filter(Boolean).join(" "))
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

export function profileVector(profile) {
  const terms = profileTerms(profile);
  const features = [...terms];
  for (let i = 0; i < terms.length - 1; i++) features.push(`${terms[i]}_${terms[i + 1]}`);
  const vector = new Map();
  for (const feature of features) {
    vector.set(feature, (vector.get(feature) || 0) + 1);
  }
  return vector;
}

export function profileSemanticSimilarity(profileA, profileB) {
  const vectorA = profileVector(profileA);
  const vectorB = profileVector(profileB);
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const [term, value] of vectorA) {
    dot += value * (vectorB.get(term) || 0);
    normA += value * value;
  }
  for (const value of vectorB.values()) normB += value * value;
  if (!normA || !normB) return 0;
  const cosine = dot / Math.sqrt(normA * normB);
  return Math.max(0, Math.min(1, cosine));
}

export function diversifyRankedCandidates(candidates, limit = 12) {
  const remaining = [...candidates];
  const selected = [];
  const departmentCounts = new Map();
  const roleCounts = new Map();

  while (remaining.length && selected.length < limit) {
    let bestIndex = 0;
    let bestAdjusted = -Infinity;
    for (let index = 0; index < remaining.length; index++) {
      const candidate = remaining[index];
      const department = candidate.candidate?.department || candidate.department || "Unassigned";
      const role = candidate.candidate?.user?.role || candidate.role || "UNKNOWN";
      const adjustment = Math.min(0.12, (departmentCounts.get(department) || 0) * 0.055) +
        Math.min(0.08, (roleCounts.get(role) || 0) * 0.025);
      const adjusted = candidate.matchScore - adjustment;
      if (adjusted > bestAdjusted) {
        bestAdjusted = adjusted;
        bestIndex = index;
      }
    }

    const [candidate] = remaining.splice(bestIndex, 1);
    const department = candidate.candidate?.department || candidate.department || "Unassigned";
    const role = candidate.candidate?.user?.role || candidate.role || "UNKNOWN";
    const adjustment = Math.max(0, candidate.matchScore - bestAdjusted);
    selected.push({ ...candidate, diversityAdjustment: adjustment });
    departmentCounts.set(department, (departmentCounts.get(department) || 0) + 1);
    roleCounts.set(role, (roleCounts.get(role) || 0) + 1);
  }

  return selected;
}
