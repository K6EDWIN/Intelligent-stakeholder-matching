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
    where: {
      isHidden: false,
      postedBy: { isDeleted: false },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
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

  const payload = await request.json().catch(() => ({}));
  const { title, description, type, sourceUrl, expiresAt, division, employmentType } = payload;

  if (typeof title !== "string" || !title.trim() || title.length > 180
    || typeof description !== "string" || !description.trim() || description.length > 12000
    || typeof type !== "string" || !type.trim() || type.length > 80) {
    return NextResponse.json(
      { error: "title, description, and type are required" },
      { status: 400 }
    );
  }

  let parsedSourceUrl = null;
  if (sourceUrl) {
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only administrators can publish listings sourced from Kenya Airways Careers." }, { status: 403 });
    }
    try {
      const url = new URL(sourceUrl);
      if (url.protocol !== "https:" || url.hostname !== "careers.kenya-airways.com" || (url.port && url.port !== "443") || url.username || url.password || !/^\/anonymous\/listing\/[\da-f-]{36}\/details\/?$/i.test(url.pathname)) throw new Error();
      parsedSourceUrl = url.toString();
    } catch {
      return NextResponse.json({ error: "Source link must be an official Kenya Airways Careers job details link." }, { status: 400 });
    }
  }
  const parsedExpiry = expiresAt ? new Date(expiresAt) : null;
  if (parsedSourceUrl && !parsedExpiry) {
    return NextResponse.json({ error: "Add the official application deadline before publishing a Kenya Airways listing." }, { status: 400 });
  }
  if (expiresAt && Number.isNaN(parsedExpiry.getTime())) {
    return NextResponse.json({ error: "The application deadline is invalid." }, { status: 400 });
  }
  if (parsedExpiry && parsedExpiry <= new Date()) {
    return NextResponse.json({ error: "This opportunity has passed its application deadline." }, { status: 400 });
  }

  const opportunity = await prisma.opportunity.create({
    data: {
      postedById: session.user.id,
      title: title.trim(),
      description: description.trim(),
      type: type.trim(),
      sourceUrl: parsedSourceUrl,
      expiresAt: parsedExpiry,
      division: typeof division === "string" ? division.trim().slice(0, 120) || null : null,
      employmentType: typeof employmentType === "string" ? employmentType.trim().slice(0, 120) || null : null,
    },
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
