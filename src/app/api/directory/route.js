import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/directory?role=&skill=&interest=&q=
// Lists public, verified stakeholder profiles for browsing/search -- the
// member directory. Excludes the logged-in user's own profile.
export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role") || "";
  const skillId = searchParams.get("skill") || "";
  const interestId = searchParams.get("interest") || "";
  const department = searchParams.get("department")?.trim() || "";
  const q = searchParams.get("q")?.trim() || "";
  const publicMemberWhere = {
    isPublic: true,
    user: { isVerified: true, isSuspended: false, isDeleted: false, isDemo: false },
  };

  if (searchParams.get("departments") === "true") {
    const departments = await prisma.profile.findMany({
      where: { ...publicMemberWhere, department: { not: null } },
      select: { department: true },
      distinct: ["department"],
      orderBy: { department: "asc" },
    });
    return NextResponse.json({ departments: departments.map((item) => item.department).filter(Boolean) });
  }

  const profiles = await prisma.profile.findMany({
    where: {
      isPublic: true,
      userId: { not: session.user.id },
      user: {
        isVerified: true,
        isSuspended: false,
        isDeleted: false,
        isDemo: false,
        ...(role ? { role } : {}),
      },
      ...(skillId ? { skills: { some: { skillId } } } : {}),
      ...(interestId ? { interests: { some: { interestId } } } : {}),
      ...(department ? { department: { equals: department, mode: "insensitive" } } : {}),
      ...(q
        ? {
            OR: [
              { fullName: { contains: q, mode: "insensitive" } },
              { department: { contains: q, mode: "insensitive" } },
              { bio: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      user: { select: { id: true, role: true } },
      skills: { include: { skill: true } },
      interests: { include: { interest: true } },
    },
    orderBy: { fullName: "asc" },
  });

  const results = profiles.map((p) => ({
    userId: p.user.id,
    role: p.user.role,
    fullName: p.fullName,
    department: p.department,
    bio: p.bio,
    mentorshipRole: p.mentorshipRole,
    availability: p.availability,
    skills: p.skills.map((s) => s.skill.name),
    interests: p.interests.map((i) => i.interest.name),
  }));

  return NextResponse.json({ profiles: results });
}
