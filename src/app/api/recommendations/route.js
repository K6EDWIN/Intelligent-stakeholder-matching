import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sharedAttributes } from "@/lib/recommendation";
import { buildConnectionsByUser } from "@/lib/collaborative";
import {
  buildTrainingExamples,
  scoreCandidate,
  trainAcceptanceModel,
  trainRelevanceModel,
} from "@/lib/adaptive-recommender";
import { getAdaptivePredictions } from "@/lib/hosted-ml";
import { diversifyRankedCandidates } from "@/lib/profile-vectors";
import { getMlUserKey } from "@/lib/ml-sync-auth";

// GET /api/recommendations
// Fits a small acceptance model from resolved, feature-snapshotted live
// requests. The model gradually takes over ranking as labeled outcomes grow.
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const ownerProfile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    include: { skills: { include: { skill: true } }, interests: { include: { interest: true } } },
  });

  if (!ownerProfile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const ownerAttrs = {
    skillIds: ownerProfile.skills.map((item) => item.skillId),
    interestIds: ownerProfile.interests.map((item) => item.interestId),
  };

  const candidates = await prisma.profile.findMany({
    where: {
      isPublic: true,
      userId: { not: session.user.id },
      user: { isVerified: true, isSuspended: false, isDemo: false },
    },
    include: {
      user: { select: { id: true, role: true } },
      skills: { include: { skill: true } },
      interests: { include: { interest: true } },
    },
  });

  const [acceptedMentorships, acceptedConnections, resolvedMentorships, resolvedConnections] = await Promise.all([
    prisma.mentorshipRequest.findMany({
      where: { status: "ACCEPTED", sender: { is: { isDemo: false } }, receiver: { is: { isDemo: false } } },
      select: { senderId: true, receiverId: true },
    }),
    prisma.connectionRequest.findMany({
      where: { status: "ACCEPTED", sender: { is: { isDemo: false } }, receiver: { is: { isDemo: false } } },
      select: { senderId: true, receiverId: true },
    }),
    prisma.mentorshipRequest.findMany({
      where: { status: { in: ["ACCEPTED", "DECLINED"] }, sender: { is: { isDemo: false } }, receiver: { is: { isDemo: false } } },
      select: { status: true, modelFeatures: true },
    }),
    prisma.connectionRequest.findMany({
      where: { status: { in: ["ACCEPTED", "DECLINED"] }, sender: { is: { isDemo: false } }, receiver: { is: { isDemo: false } } },
      select: { status: true, modelFeatures: true },
    }),
  ]);

  const connectionsByUser = buildConnectionsByUser([
    ...acceptedMentorships,
    ...acceptedConnections,
  ]);
  const examples = buildTrainingExamples([
    ...resolvedMentorships,
    ...resolvedConnections,
  ]);
  const model = trainAcceptanceModel(examples);
  const feedbackRows = await prisma.feedback.findMany({
    where: {
      userId: session.user.id,
      recommendationId: { not: null },
      user: { isDemo: false },
      recommendation: { is: { owner: { isDemo: false }, matchedUser: { isDemo: false } } },
    },
    select: { rating: true, modelFeatures: true, recommendation: { select: { matchedUserId: true } } },
  });
  const relevanceModel = trainRelevanceModel(feedbackRows);
  const modelArtifacts = await prisma.mLModelArtifact.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
  });
  const totalInteractions = acceptedMentorships.length + acceptedConnections.length;

  const scored = candidates.map((candidate) => {
    const candidateAttrs = {
      skillIds: candidate.skills.map((item) => item.skillId),
      interestIds: candidate.interests.map((item) => item.interestId),
    };
    const score = scoreCandidate({
      owner: ownerProfile,
      candidate,
      ownerAttrs,
      candidateAttrs,
      connectionsByUser,
      model,
      totalAcceptedInteractions: totalInteractions,
    });
    const { sharedSkillIds, sharedInterestIds } = sharedAttributes(
      ownerAttrs,
      candidateAttrs
    );

    return {
      candidate,
      ...score,
      sharedSkillNames: candidate.skills
        .filter((item) => sharedSkillIds.includes(item.skillId))
        .map((item) => item.skill.name),
      sharedInterestNames: candidate.interests
        .filter((item) => sharedInterestIds.includes(item.interestId))
        .map((item) => item.interest.name),
    };
  });

  const hostedPredictions = await getAdaptivePredictions({
    examples,
    relevanceExamples: feedbackRows
      .filter((row) => row.modelFeatures && (row.rating >= 4 || row.rating <= 2))
      .map((row) => ({ features: row.modelFeatures, label: row.rating >= 4 ? 1 : 0 })),
    candidates: scored.map((item) => ({ features: item.modelFeatures })),
    ncfCandidates: scored.map((item) => ({
      senderKey: getMlUserKey(session.user.id),
      recipientKey: getMlUserKey(item.candidate.user.id),
    })),
    localModel: model,
    relevanceModel,
    artifacts: modelArtifacts,
  });
  const relevanceOutput = hostedPredictions.relevanceModel || relevanceModel;
  const ncfOutput = hostedPredictions.ncfModel || { active: false, sampleCount: 0, acceptedCount: 0, declinedCount: 0, confidence: 0 };
  const ncfPredictions = hostedPredictions.ncfPredictions || scored.map(() => null);
  const relevancePredictions = hostedPredictions.relevancePredictions || scored.map(({ modelFeatures }) =>
    relevanceModel.active ? relevanceModel.predict(modelFeatures) : null
  );
  scored.forEach((item, index) => {
    item.mlAcceptanceProbability = hostedPredictions.predictions[index];
    item.mlConfidence = hostedPredictions.model.confidence;
    const acceptanceScore = item.mlAcceptanceProbability === null
      ? item.baselineScore
      : item.baselineScore * (1 - item.mlConfidence) +
        item.mlAcceptanceProbability * item.mlConfidence;
    item.ncfProbability = ncfPredictions[index];
    item.ncfInfluence = item.ncfProbability === null
      ? 0
      : Math.min(0.2, ncfOutput.confidence * 0.2);
    const ncfAdjustedScore = item.ncfProbability === null
      ? acceptanceScore
      : acceptanceScore * (1 - item.ncfInfluence) + item.ncfProbability * item.ncfInfluence;
    item.mlRelevanceProbability = relevancePredictions[index];
    item.relevanceInfluence = item.mlRelevanceProbability === null
      ? 0
      : relevanceOutput.confidence * 0.35;
    item.matchScore = item.mlRelevanceProbability === null
      ? ncfAdjustedScore
      : ncfAdjustedScore * (1 - item.relevanceInfluence) +
        item.mlRelevanceProbability * item.relevanceInfluence;
  });

  const rankedCandidates = diversifyRankedCandidates(
    [...scored].sort((a, b) => b.matchScore - a.matchScore),
    12
  );
  const savedRecommendations = await prisma.$transaction(
    rankedCandidates.map(({ candidate, contentScore, collaborativeScore, semanticScore, matchScore, modelFeatures }, index) =>
      prisma.recommendation.upsert({
        where: { ownerId_matchedUserId: { ownerId: session.user.id, matchedUserId: candidate.user.id } },
        update: { contentScore, collaborativeScore, semanticScore, hybridScore: matchScore, modelFeatures, rank: index + 1 },
        create: {
          ownerId: session.user.id,
          matchedUserId: candidate.user.id,
          contentScore,
          collaborativeScore,
          semanticScore,
          hybridScore: matchScore,
          modelFeatures,
          rank: index + 1,
        },
      })
    )
  );

  const recommendationIds = new Map(savedRecommendations.map((row) => [row.matchedUserId, row.id]));
  const feedbackByCandidate = new Map(feedbackRows.map((row) => [row.recommendation?.matchedUserId, row.rating]));
  const ranked = rankedCandidates
    .map((item) => ({
      recommendationId: recommendationIds.get(item.candidate.user.id),
      feedbackRating: feedbackByCandidate.get(item.candidate.user.id) ?? null,
      userId: item.candidate.user.id,
      role: item.candidate.user.role,
      fullName: item.candidate.fullName,
      department: item.candidate.department,
      bio: item.candidate.bio,
      mentorshipRole: item.candidate.mentorshipRole,
      matchPercent: Math.round(item.matchScore * 100),
      rankAdjustedPercent: Math.round((item.matchScore - item.diversityAdjustment) * 100),
      contentScore: Math.round(item.contentScore * 100),
      semanticScore: Math.round(item.semanticScore * 100),
      collaborativeScore: Math.round(item.collaborativeScore * 100),
      relevanceProbability: item.mlRelevanceProbability === null ? null : Math.round(item.mlRelevanceProbability * 100),
      relevanceInfluence: Math.round(item.relevanceInfluence * 100),
      diversityAdjustment: Math.round(item.diversityAdjustment * 100),
      mlAcceptanceProbability: item.mlAcceptanceProbability === null
        ? null
        : Math.round(item.mlAcceptanceProbability * 100),
      mlInfluence: Math.round(item.mlConfidence * 100),
      ncfAcceptanceProbability: item.ncfProbability === null ? null : Math.round(item.ncfProbability * 100),
      ncfInfluence: Math.round(item.ncfInfluence * 100),
      signals: {
        skillOverlap: Math.round((Number(item.modelFeatures.skillOverlap) || 0) * 100),
        interestOverlap: Math.round((Number(item.modelFeatures.interestOverlap) || 0) * 100),
        profileTextAlignment: Math.round((Number(item.modelFeatures.semanticProfileOverlap) || 0) * 100),
        sameDepartment: Boolean(item.modelFeatures.sameDepartment),
        mentorshipRoleFit: Boolean(item.modelFeatures.mentorshipRoleFit),
        sharedNetwork: Math.round((Number(item.modelFeatures.sharedNetwork) || 0) * 100),
        requestType: item.modelFeatures.isMentorshipRequest ? "Mentorship" : "Connection",
      },
      sharedSkills: item.sharedSkillNames,
      sharedInterests: item.sharedInterestNames,
    }));

  return NextResponse.json({
    recommendations: ranked,
    meta: {
      totalInteractions,
      model: {
        active: hostedPredictions.model.active,
        provider: hostedPredictions.provider,
        trainingExamples: hostedPredictions.model.sampleCount,
        acceptedExamples: hostedPredictions.model.acceptedCount,
        declinedExamples: hostedPredictions.model.declinedCount,
        confidence: Math.round(hostedPredictions.model.confidence * 100),
        status: hostedPredictions.model.active ? "LEARNING_FROM_OUTCOMES" : "GATHERING_OUTCOMES",
      },
      relevanceModel: {
        active: relevanceOutput.active,
        trainingExamples: relevanceOutput.sampleCount,
        confidence: Math.round(relevanceOutput.confidence * 100),
        status: relevanceOutput.active ? "LEARNING_FROM_MEMBER_FEEDBACK" : "GATHERING_FEEDBACK",
      },
      ncfModel: {
        ...ncfOutput,
        confidence: Math.round(ncfOutput.confidence * 100),
      },
      ranking: { semanticProfileSignal: true, diversityReranking: true, version: "profile-vector-feedback-ranker-v2" },
    },
  });
}
