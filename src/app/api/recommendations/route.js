import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeContentScore, sharedAttributes } from "@/lib/recommendation";
import {
  buildConnectionsByUser,
  computeCollaborativeScore,
} from "@/lib/collaborative";
import { computeHybridWeights, computeHybridScore } from "@/lib/hybrid";

// GET /api/recommendations
// Computes content-based similarity and user-based collaborative filtering
// between the logged-in user and every other eligible stakeholder, combines
// them into a hybrid score (cold-start-aware weighting -- see
// src/lib/hybrid.js), persists all three scores to the Recommendation
// table, and ranks the "Suggested for you" list by hybridScore.
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
    skillIds: ownerProfile.skills.map((s) => s.skillId),
    interestIds: ownerProfile.interests.map((i) => i.interestId),
  };

  const candidates = await prisma.profile.findMany({
    where: {
      isPublic: true,
      userId: { not: session.user.id },
      user: { isVerified: true },
    },
    include: {
      user: { select: { id: true, role: true } },
      skills: { include: { skill: true } },
      interests: { include: { interest: true } },
    },
  });

  const [acceptedMentorships, acceptedConnections] = await Promise.all([
    prisma.mentorshipRequest.findMany({
      where: { status: "ACCEPTED" },
      select: { senderId: true, receiverId: true },
    }),
    prisma.connectionRequest.findMany({
      where: { status: "ACCEPTED" },
      select: { senderId: true, receiverId: true },
    }),
  ]);
  const connectionsByUser = buildConnectionsByUser([
    ...acceptedMentorships,
    ...acceptedConnections,
  ]);
  const hybridWeights = computeHybridWeights(
    acceptedMentorships.length + acceptedConnections.length
  );

  const scored = candidates.map((candidate) => {
    const candidateAttrs = {
      skillIds: candidate.skills.map((s) => s.skillId),
      interestIds: candidate.interests.map((i) => i.interestId),
    };

    const contentScore = computeContentScore(ownerAttrs, candidateAttrs);
    const collaborativeScore = computeCollaborativeScore(
      connectionsByUser,
      session.user.id,
      candidate.user.id
    );
    const hybridScore = computeHybridScore(
      contentScore,
      collaborativeScore,
      hybridWeights
    );
    const { sharedSkillIds, sharedInterestIds } = sharedAttributes(
      ownerAttrs,
      candidateAttrs
    );

    const sharedSkillNames = candidate.skills
      .filter((s) => sharedSkillIds.includes(s.skillId))
      .map((s) => s.skill.name);
    const sharedInterestNames = candidate.interests
      .filter((i) => sharedInterestIds.includes(i.interestId))
      .map((i) => i.interest.name);

    return {
      candidate,
      contentScore,
      collaborativeScore,
      hybridScore,
      sharedSkillNames,
      sharedInterestNames,
    };
  });

  // Persist all three scores. hybridScore -- not contentScore -- is now the
  // ranking signal, per the weighted formula in src/lib/hybrid.js.
  await prisma.$transaction(
    scored.map(({ candidate, contentScore, collaborativeScore, hybridScore }) =>
      prisma.recommendation.upsert({
        where: {
          ownerId_matchedUserId: {
            ownerId: session.user.id,
            matchedUserId: candidate.user.id,
          },
        },
        update: {
          contentScore,
          collaborativeScore,
          hybridScore,
        },
        create: {
          ownerId: session.user.id,
          matchedUserId: candidate.user.id,
          contentScore,
          collaborativeScore,
          hybridScore,
        },
      })
    )
  );

  const totalInteractions = acceptedMentorships.length + acceptedConnections.length;

  const ranked = scored
    .sort((a, b) => b.hybridScore - a.hybridScore)
    .slice(0, 12)
    .map((s) => ({
      userId: s.candidate.user.id,
      role: s.candidate.user.role,
      fullName: s.candidate.fullName,
      department: s.candidate.department,
      bio: s.candidate.bio,
      mentorshipRole: s.candidate.mentorshipRole,
      matchPercent: Math.round(s.hybridScore * 100),
      contentScore: Math.round(s.contentScore * 100),
      collaborativeScore: Math.round(s.collaborativeScore * 100),
      sharedSkills: s.sharedSkillNames,
      sharedInterests: s.sharedInterestNames,
    }));

  return NextResponse.json({
    recommendations: ranked,
    meta: {
      totalInteractions,
      weights: {
        alpha: Math.round(hybridWeights.alpha * 100),
        beta: Math.round(hybridWeights.beta * 100),
      },
    },
  });
}
