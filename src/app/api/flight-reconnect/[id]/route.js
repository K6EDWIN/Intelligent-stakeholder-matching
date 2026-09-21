import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
