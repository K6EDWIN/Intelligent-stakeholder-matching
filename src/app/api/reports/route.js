import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit-log";

const TARGET_TYPES = ["USER", "OPPORTUNITY", "EVENT"];
const REASONS = ["HARASSMENT", "INAPPROPRIATE_CONTENT", "SPAM", "MISINFORMATION", "OTHER"];

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { targetType, targetId, reason, description } = body;
  if (!TARGET_TYPES.includes(targetType) || typeof targetId !== "string" || !targetId.trim()) {
    return NextResponse.json({ error: "A valid report target is required" }, { status: 400 });
  }
  if (!REASONS.includes(reason)) {
    return NextResponse.json({ error: "Choose a valid report reason" }, { status: 400 });
  }
  if (description != null && (typeof description !== "string" || description.length > 1000)) {
    return NextResponse.json({ error: "Report details must be 1000 characters or fewer" }, { status: 400 });
  }

  const id = targetId.trim();
  let exists = false;
  if (targetType === "USER") {
    const target = await prisma.user.findFirst({
      where: { id, isDemo: false, isDeleted: false, role: { not: "ADMIN" } },
      select: { id: true },
    });
    exists = Boolean(target && target.id !== session.user.id);
  } else if (targetType === "OPPORTUNITY") {
    exists = Boolean(await prisma.opportunity.findFirst({ where: { id, isHidden: false }, select: { id: true } }));
  } else {
    exists = Boolean(await prisma.event.findFirst({ where: { id, isHidden: false }, select: { id: true } }));
  }
  if (!exists) return NextResponse.json({ error: "Report target not found" }, { status: 404 });

  const duplicate = await prisma.report.findFirst({
    where: { reporterId: session.user.id, targetType, targetId: id, status: "OPEN" },
    select: { id: true },
  });
  if (duplicate) return NextResponse.json({ error: "You already reported this item" }, { status: 409 });

  const report = await prisma.report.create({
    data: {
      reporterId: session.user.id,
      targetType,
      targetId: id,
      reason,
      description: description?.trim() || null,
    },
    select: { id: true, targetType: true, status: true, createdAt: true },
  });
  await logActivity({
    actorId: session.user.id,
    actionType: "CONTENT_REPORTED",
    targetId: id,
    summary: "Submitted a community safety report",
    details: { reportId: report.id, targetType },
  });

  return NextResponse.json({ report }, { status: 201 });
}
