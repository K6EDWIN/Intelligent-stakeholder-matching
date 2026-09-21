import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/flight-reconnect
// Returns the logged-in user's own logged flights, plus "matches" -- other
// verified stakeholders who logged the same route on the same date.
//
// Privacy: login itself already requires isVerified (see src/lib/auth.js),
// so every session here is already a verified user -- restricting to
// verified users doesn't need an extra check. Beyond that, a flight is only
// ever visible to someone else if BOTH sides opted in (consentToShare on
// both rows), not just the other person's -- one-way visibility would let a
// non-consenting user peek at consenting users' travel data for free, which
// the README's "opt-in and restricted" data-minimization principle reads as
// ruling out.
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const myFlights = await prisma.flightReconnect.findMany({
    where: { userId: session.user.id },
    orderBy: { travelDate: "asc" },
  });

  const consentedFlights = myFlights.filter((f) => f.consentToShare);

  const matches = [];
  for (const flight of consentedFlights) {
    const others = await prisma.flightReconnect.findMany({
      where: {
        flightRoute: flight.flightRoute,
        travelDate: flight.travelDate,
        consentToShare: true,
        userId: { not: session.user.id },
      },
      include: {
        user: { select: { id: true, role: true, profile: { select: { fullName: true } } } },
      },
    });

    for (const other of others) {
      matches.push({
        flightRoute: flight.flightRoute,
        travelDate: flight.travelDate,
        userId: other.user.id,
        role: other.user.role,
        fullName: other.user.profile?.fullName || "Unknown",
      });
    }
  }

  return NextResponse.json({ myFlights, matches });
}

// POST /api/flight-reconnect
// Logs a flight route/date for the logged-in user, with explicit consent.
export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { flightRoute, travelDate, consentToShare } = await request.json();

  if (!flightRoute || !travelDate) {
    return NextResponse.json(
      { error: "flightRoute and travelDate are required" },
      { status: 400 }
    );
  }

  const parsedDate = new Date(travelDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return NextResponse.json({ error: "travelDate is invalid" }, { status: 400 });
  }

  const flight = await prisma.flightReconnect.create({
    data: {
      userId: session.user.id,
      flightRoute,
      travelDate: parsedDate,
      consentToShare: Boolean(consentToShare),
    },
  });

  return NextResponse.json({ flight }, { status: 201 });
}
