import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit-log";

// GET /api/opportunities
// Lists all opportunities, most recent first.
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const opportunities = await prisma.opportunity.findMany({
    where: { isHidden: false, postedBy: { isDeleted: false } },
    include: {
      postedBy: { select: { id: true, profile: { select: { fullName: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ opportunities });
}

// POST /api/opportunities
// Posts a new opportunity (career opening, internship, workshop, reunion,
// etc. -- type is a free-text category, not an enum).
export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { title, description, type } = await request.json();

  if (!title || !description || !type) {
    return NextResponse.json(
      { error: "title, description, and type are required" },
      { status: 400 }
    );
  }

  const opportunity = await prisma.opportunity.create({
    data: { postedById: session.user.id, title, description, type },
  });

  await logActivity({
    actorId: session.user.id,
    targetId: session.user.id,
    actionType: "OPPORTUNITY_CREATED",
    summary: `Posted the opportunity “${title}”`,
    details: { opportunityId: opportunity.id, title, category: type },
  });

  return NextResponse.json({ opportunity }, { status: 201 });
}
