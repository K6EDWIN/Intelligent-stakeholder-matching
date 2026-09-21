import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/events/[id]/rsvp
// Joins the logged-in user to the event.
export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  await prisma.eventParticipant.upsert({
    where: { eventId_userId: { eventId: id, userId: session.user.id } },
    update: {},
    create: { eventId: id, userId: session.user.id },
  });

  return NextResponse.json({ joined: true });
}

// DELETE /api/events/[id]/rsvp
// Removes the logged-in user's RSVP.
export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  await prisma.eventParticipant.deleteMany({
    where: { eventId: id, userId: session.user.id },
  });

  return NextResponse.json({ joined: false });
}
