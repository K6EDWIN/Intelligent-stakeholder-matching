import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/flight-reconnect/[id]
// The owner may enable or withdraw route-matching consent at any time.
export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  if (typeof body.consentToShare !== "boolean") {
    return NextResponse.json({ error: "consentToShare must be true or false" }, { status: 400 });
  }

  const existing = await prisma.flightReconnect.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Flight not found" }, { status: 404 });
  }
  if (existing.userId !== session.user.id) {
    return NextResponse.json({ error: "You can only change your own flight" }, { status: 403 });
  }
  if (body.consentToShare && !/^v2\|KQ ?\d{1,4}[A-Z]?\|[A-Z]{3}\|[A-Z]{3}$/.test(existing.flightRoute)) {
    return NextResponse.json({ error: "Remove this older trip and log it again to enable exact-flight matching" }, { status: 400 });
  }

  const flight = await prisma.flightReconnect.update({
    where: { id },
    data: { consentToShare: body.consentToShare },
  });
  return NextResponse.json({ flight });
}

// DELETE /api/flight-reconnect/[id]
// Removes one of the logged-in user's own logged flights -- lets them
// withdraw previously shared travel data, since consent should be
// revocable, not just a one-time checkbox.
export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.flightReconnect.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Flight not found" }, { status: 404 });
  }
  if (existing.userId !== session.user.id) {
    return NextResponse.json(
      { error: "You can only remove your own logged flights" },
      { status: 403 }
    );
  }

  await prisma.flightReconnect.delete({ where: { id } });

  return NextResponse.json({ deleted: true });
}
