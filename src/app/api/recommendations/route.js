import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeContentScore, sharedAttributes } from "@/lib/recommendation";
import {
  buildConnectionsByUser,
  computeCollaborativeScore,
} from "@/lib/collaborative";

// GET /api/recommendations
// Computes content-based similarity between the logged-in user and every
// other eligible stakeholder, plus user-based collaborative filtering over
// accepted mentorship/connection interactions, and persists both scores to
// the Recommendation table. Ranking here is still by contentScore alone --
// combining the two into hybridScore and re-ranking by it is #8, a separate
// step so each is independently reviewable.
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
      sharedSkillNames,
      sharedInterestNames,
    };
  });

  // Persist scores so this data is available for hybrid scoring (#8).
  // hybridScore is still just contentScore for now -- combining it with
  // collaborativeScore and re-ranking by the result is #8's job, kept
  // separate so each step is independently reviewable.
  await prisma.$transaction(
    scored.map(({ candidate, contentScore, collaborativeScore }) =>
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
          hybridScore: contentScore,
        },
        create: {
          ownerId: session.user.id,
          matchedUserId: candidate.user.id,
          contentScore,
          collaborativeScore,
          hybridScore: contentScore,
        },
      })
    )
  );

  const ranked = scored
    .sort((a, b) => b.contentScore - a.contentScore)
    .slice(0, 10)
    .map((s) => ({
      userId: s.candidate.user.id,
      role: s.candidate.user.role,
      fullName: s.candidate.fullName,
      department: s.candidate.department,
      mentorshipRole: s.candidate.mentorshipRole,
      matchPercent: Math.round(s.contentScore * 100),
      sharedSkills: s.sharedSkillNames,
      sharedInterests: s.sharedInterestNames,
    }));

  return NextResponse.json({ recommendations: ranked });
}
