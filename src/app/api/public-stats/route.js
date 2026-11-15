import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const liveMemberWhere = {
      isVerified: true,
      isSuspended: false,
      isDeleted: false,
      isDemo: false,
      role: { not: "ADMIN" },
      profile: { is: { isPublic: true } },
    };
    const liveRelationshipWhere = {
      status: "ACCEPTED",
      sender: { is: { isDemo: false, isDeleted: false } },
      receiver: { is: { isDemo: false, isDeleted: false } },
    };
    const [members, acceptedMentorships, acceptedConnections] = await Promise.all([
      prisma.user.count({ where: liveMemberWhere }),
      prisma.mentorshipRequest.count({ where: liveRelationshipWhere }),
      prisma.connectionRequest.count({ where: liveRelationshipWhere }),
    ]);

    return NextResponse.json(
      { members, acceptedRelationships: acceptedMentorships + acceptedConnections },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Public statistics query failed:", error);
    return NextResponse.json({ error: "Statistics are temporarily unavailable" }, { status: 503 });
  }
}
