import { computeContentScore } from "./recommendation";
import { computeCollaborativeScore } from "./collaborative";
import { computeHybridScore, computeHybridWeights } from "./hybrid";

const FEATURE_NAMES = [
  "skillOverlap",
  "interestOverlap",
  "sameDepartment",
  "mentorshipRoleFit",
  "sharedNetwork",
  "isMentorshipRequest",
];
const MIN_TRAINING_ROWS = 12;
const MIN_PER_CLASS = 4;

function overlap(idsA, idsB) {
  const a = new Set(idsA || []);
  const b = new Set(idsB || []);
  if (a.size === 0 && b.size === 0) return 0;
  let shared = 0;
  for (const id of a) if (b.has(id)) shared++;
  return shared / new Set([...a, ...b]).size;
}

/** Features are captured when a request is sent, before its outcome is known. */
export function extractPairFeatures(sender, recipient, requestType, sharedNetwork = 0) {
  const senderSkillIds = (sender.skills || []).map((item) => item.skillId);
  const recipientSkillIds = (recipient.skills || []).map((item) => item.skillId);
  const senderInterestIds = (sender.interests || []).map((item) => item.interestId);
  const recipientInterestIds = (recipient.interests || []).map((item) => item.interestId);
  const senderRole = sender.mentorshipRole;
  const recipientRole = recipient.mentorshipRole;
  const mentorshipRoleFit =
    (senderRole === "MENTEE" || senderRole === "BOTH") &&
    (recipientRole === "MENTOR" || recipientRole === "BOTH")
      ? 1
      : 0;

  return {
    skillOverlap: overlap(senderSkillIds, recipientSkillIds),
    interestOverlap: overlap(senderInterestIds, recipientInterestIds),
    sameDepartment:
      sender.department && recipient.department &&
      sender.department.toLowerCase() === recipient.department.toLowerCase()
        ? 1
        : 0,
    mentorshipRoleFit: requestType === "MENTORSHIP" ? mentorshipRoleFit : 0,
    sharedNetwork: Math.max(0, Math.min(1, sharedNetwork)),
    isMentorshipRequest: requestType === "MENTORSHIP" ? 1 : 0,
  };
}

function sigmoid(value) {
  if (value < -30) return 0;
  if (value > 30) return 1;
  return 1 / (1 + Math.exp(-value));
}

/** Small L2-regularized logistic regression trained on resolved live requests. */
export function trainAcceptanceModel(examples) {
  const accepted = examples.filter((example) => example.label === 1).length;
  const declined = examples.length - accepted;
  if (
    examples.length < MIN_TRAINING_ROWS ||
    accepted < MIN_PER_CLASS ||
    declined < MIN_PER_CLASS
  ) {
    return {
      active: false,
      sampleCount: examples.length,
      acceptedCount: accepted,
      declinedCount: declined,
      confidence: 0,
      predict: () => 0.5,
    };
  }

  const weights = Array(FEATURE_NAMES.length).fill(0);
  let bias = 0;
  const acceptedWeight = examples.length / (2 * accepted);
  const declinedWeight = examples.length / (2 * declined);

  // Full-batch gradient descent keeps this small model deterministic and fast.
  for (let epoch = 0; epoch < 500; epoch++) {
    const gradients = Array(FEATURE_NAMES.length).fill(0);
    let biasGradient = 0;
    for (const example of examples) {
      const features = FEATURE_NAMES.map((name) => Number(example.features?.[name]) || 0);
      const probability = sigmoid(
        bias + features.reduce((sum, value, index) => sum + value * weights[index], 0)
      );
      const classWeight = example.label === 1 ? acceptedWeight : declinedWeight;
      const error = (probability - example.label) * classWeight;
      biasGradient += error;
      for (let index = 0; index < gradients.length; index++) {
        gradients[index] += error * features[index];
      }
    }
    const rate = 0.12 / examples.length;
    bias -= rate * biasGradient;
    for (let index = 0; index < weights.length; index++) {
      weights[index] -= rate * (gradients[index] + 0.8 * weights[index]);
    }
  }

  const confidence = Math.max(0, Math.min(1, (examples.length - MIN_TRAINING_ROWS) / 38));
  return {
    active: true,
    sampleCount: examples.length,
    acceptedCount: accepted,
    declinedCount: declined,
    confidence,
    weights: Object.fromEntries(FEATURE_NAMES.map((name, index) => [name, weights[index]])),
    predict(features) {
      return sigmoid(
        bias + FEATURE_NAMES.reduce(
          (sum, name, index) => sum + (Number(features?.[name]) || 0) * weights[index],
          0
        )
      );
    },
  };
}

export function buildTrainingExamples(requests) {
  return requests
    .filter((request) => request.modelFeatures && ["ACCEPTED", "DECLINED"].includes(request.status))
    .map((request) => ({
      features: request.modelFeatures,
      label: request.status === "ACCEPTED" ? 1 : 0,
    }));
}

export function scoreCandidate({
  owner,
  candidate,
  ownerAttrs,
  candidateAttrs,
  connectionsByUser,
  model,
  totalAcceptedInteractions = 0,
}) {
  const contentScore = computeContentScore(ownerAttrs, candidateAttrs);
  const collaborativeScore = computeCollaborativeScore(
    connectionsByUser,
    owner.userId,
    candidate.user.id
  );
  const baselineWeights = computeHybridWeights(totalAcceptedInteractions);
  const baselineScore = computeHybridScore(contentScore, collaborativeScore, baselineWeights);
  const modelFeatures = extractPairFeatures(owner, candidate, "MENTORSHIP", collaborativeScore);
  const mlAcceptanceProbability = model.active ? model.predict(modelFeatures) : null;
  const matchScore = model.active
    ? baselineScore * (1 - model.confidence) + mlAcceptanceProbability * model.confidence
    : baselineScore;

  return {
    contentScore,
    collaborativeScore,
    baselineScore,
    modelFeatures,
    mlAcceptanceProbability,
    matchScore,
    mlConfidence: model.confidence,
  };
}
