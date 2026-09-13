import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: return the logged-in user's own profile, including their
// currently selected skills and interests.
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    include: {
      skills: { include: { skill: true } },
      interests: { include: { interest: true } },
    },
  });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({
    profile: {
      ...profile,
      skillIds: profile.skills.map((s) => s.skillId),
      interestIds: profile.interests.map((i) => i.interestId),
    },
  });
}

// PUT: update the logged-in user's profile fields and resync their
// skill/interest selections.
export async function PUT(request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const {
    fullName,
    bio,
    department,
    professionalBackground,
    trainingHistory,
    careerGoals,
    mentorshipNeeds,
    mentorshipRole,
    availability,
    isPublic,
    skillIds = [],
    interestIds = [],
  } = body;

  if (!fullName) {
    return NextResponse.json(
      { error: "fullName is required" },
      { status: 400 }
    );
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Update the scalar fields, then fully resync the skill/interest join
  // tables to match whatever was just submitted (simplest correct approach
  // at this data scale -- delete old links, insert the new selection).
  await prisma.$transaction([
    prisma.profile.update({
      where: { id: profile.id },
      data: {
        fullName,
        bio,
        department,
        professionalBackground,
        trainingHistory,
        careerGoals,
        mentorshipNeeds,
        mentorshipRole: mentorshipRole || null,
        availability,
        isPublic: isPublic ?? true,
      },
    }),
    prisma.profileSkill.deleteMany({ where: { profileId: profile.id } }),
    prisma.profileInterest.deleteMany({ where: { profileId: profile.id } }),
    ...(skillIds.length
      ? [
          prisma.profileSkill.createMany({
            data: skillIds.map((skillId) => ({
              profileId: profile.id,
              skillId,
            })),
          }),
        ]
      : []),
    ...(interestIds.length
      ? [
          prisma.profileInterest.createMany({
            data: interestIds.map((interestId) => ({
              profileId: profile.id,
              interestId,
            })),
          }),
        ]
      : []),
  ]);

  return NextResponse.json({ message: "Profile updated" });
}
