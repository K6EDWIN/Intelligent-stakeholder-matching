import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const EVENT_TYPES = new Set(["VIEW", "DISMISS", "CONTACT"]);

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!EVENT_TYPES.has(body.eventType) || typeof body.recommendationId !== "string") {
    return NextResponse.json({ error: "Invalid recommendation event" }, { status: 400 });
  }

  const recommendation = await prisma.recommendation.findFirst({
    where: { id: body.recommendationId, ownerId: session.user.id },
    select: { id: true },
  });
  if (!recommendation) {
    return NextResponse.json({ error: "Recommendation not found" }, { status: 404 });
  }

  await prisma.recommendationEvent.create({
    data: {
      ownerId: session.user.id,
      recommendationId: recommendation.id,
      eventType: body.eventType,
    },
  });
  return NextResponse.json({ recorded: true }, { status: 201 });
}
