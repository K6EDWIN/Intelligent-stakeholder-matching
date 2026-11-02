import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit-log";

// GET /api/events
// Lists all events, soonest first, with participant count and whether the
// logged-in user has already joined.
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const events = await prisma.event.findMany({
    include: {
      createdBy: { select: { id: true, profile: { select: { fullName: true } } } },
      participants: { select: { userId: true } },
    },
    orderBy: { eventDate: "asc" },
  });

  const withRsvpInfo = events.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    location: e.location,
    eventDate: e.eventDate,
    createdByName: e.createdBy?.profile?.fullName || "Unknown",
    participantCount: e.participants.length,
    isJoined: e.participants.some((p) => p.userId === session.user.id),
  }));

  return NextResponse.json({ events: withRsvpInfo });
}

// POST /api/events
// Creates a new event.
export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { title, description, location, eventDate } = await request.json();

  if (!title || !eventDate) {
    return NextResponse.json(
      { error: "title and eventDate are required" },
      { status: 400 }
    );
  }

  const parsedDate = new Date(eventDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return NextResponse.json({ error: "eventDate is invalid" }, { status: 400 });
  }

  const event = await prisma.event.create({
    data: {
      createdById: session.user.id,
      title,
      description: description || null,
      location: location || null,
      eventDate: parsedDate,
    },
  });

  await logActivity({
    actorId: session.user.id,
    targetId: session.user.id,
    actionType: "EVENT_CREATED",
    summary: `Created the event “${title}”`,
    details: { eventId: event.id, title, eventDate: parsedDate.toISOString(), location: location || null },
  });

  return NextResponse.json({ event }, { status: 201 });
}
