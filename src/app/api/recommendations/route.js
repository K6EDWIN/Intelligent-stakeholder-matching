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
} from "@/lib/adaptive-recommender";
import { getAdaptivePredictions } from "@/lib/hosted-ml";

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
    include: { skills: true, interests: true },
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
      user: { isVerified: true, isSuspended: false },
    },
    include: {
      user: { select: { id: true, role: true } },
      skills: { include: { skill: true } },
      interests: { include: { interest: true } },
    },
  });

  const [acceptedMentorships, acceptedConnections, resolvedMentorships, resolvedConnections] = await Promise.all([
    prisma.mentorshipRequest.findMany({
      where: { status: "ACCEPTED" },
      select: { senderId: true, receiverId: true },
    }),
    prisma.connectionRequest.findMany({
      where: { status: "ACCEPTED" },
      select: { senderId: true, receiverId: true },
    }),
    prisma.mentorshipRequest.findMany({
      where: { status: { in: ["ACCEPTED", "DECLINED"] } },
      select: { status: true, modelFeatures: true },
    }),
    prisma.connectionRequest.findMany({
      where: { status: { in: ["ACCEPTED", "DECLINED"] } },
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
    candidates: scored.map((item) => ({ features: item.modelFeatures })),
    localModel: model,
  });
  scored.forEach((item, index) => {
    item.mlAcceptanceProbability = hostedPredictions.predictions[index];
    item.mlConfidence = hostedPredictions.model.confidence;
    item.matchScore = item.mlAcceptanceProbability === null
      ? item.baselineScore
      : item.baselineScore * (1 - item.mlConfidence) +
        item.mlAcceptanceProbability * item.mlConfidence;
  });

  await prisma.$transaction(
    scored.map(({ candidate, contentScore, collaborativeScore, matchScore }) =>
      prisma.recommendation.upsert({
        where: {
          ownerId_matchedUserId: {
            ownerId: session.user.id,
            matchedUserId: candidate.user.id,
          },
        },
        update: { contentScore, collaborativeScore, hybridScore: matchScore },
        create: {
          ownerId: session.user.id,
          matchedUserId: candidate.user.id,
          contentScore,
          collaborativeScore,
          hybridScore: matchScore,
        },
      })
    )
  );

  const ranked = scored
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 12)
    .map((item) => ({
      userId: item.candidate.user.id,
      role: item.candidate.user.role,
      fullName: item.candidate.fullName,
      department: item.candidate.department,
      bio: item.candidate.bio,
      mentorshipRole: item.candidate.mentorshipRole,
      matchPercent: Math.round(item.matchScore * 100),
      contentScore: Math.round(item.contentScore * 100),
      collaborativeScore: Math.round(item.collaborativeScore * 100),
      mlAcceptanceProbability: item.mlAcceptanceProbability === null
        ? null
        : Math.round(item.mlAcceptanceProbability * 100),
      mlInfluence: Math.round(item.mlConfidence * 100),
      signals: {
        skillOverlap: Math.round((Number(item.modelFeatures.skillOverlap) || 0) * 100),
        interestOverlap: Math.round((Number(item.modelFeatures.interestOverlap) || 0) * 100),
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
    },
  });
}
