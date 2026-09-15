import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const COUNTERPART_SELECT = {
  id: true,
  role: true,
  profile: { select: { fullName: true } },
};

// GET /api/mentorship-requests
// Returns the logged-in user's sent and received mentorship requests.
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const [sent, received] = await Promise.all([
    prisma.mentorshipRequest.findMany({
      where: { senderId: session.user.id },
      include: { receiver: { select: COUNTERPART_SELECT } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.mentorshipRequest.findMany({
      where: { receiverId: session.user.id },
      include: { sender: { select: COUNTERPART_SELECT } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({ sent, received });
}

// POST /api/mentorship-requests
// Send a mentorship request to another stakeholder. This -- along with
// accept/decline in [id]/route.js -- is what generates the interaction data
// collaborative filtering scores against.
export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { receiverId, message } = await request.json();

  if (!receiverId) {
    return NextResponse.json(
      { error: "receiverId is required" },
      { status: 400 }
    );
  }
  if (receiverId === session.user.id) {
    return NextResponse.json(
      { error: "You can't send a request to yourself" },
      { status: 400 }
    );
  }

  const receiver = await prisma.user.findUnique({
    where: { id: receiverId },
  });
  if (!receiver) {
    return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
  }

  const existing = await prisma.mentorshipRequest.findFirst({
    where: { senderId: session.user.id, receiverId, status: "PENDING" },
  });
  if (existing) {
    return NextResponse.json(
      { error: "You already have a pending mentorship request to this person" },
      { status: 409 }
    );
  }

  const mentorshipRequest = await prisma.mentorshipRequest.create({
    data: {
      senderId: session.user.id,
      receiverId,
      message: message || null,
    },
  });

  return NextResponse.json({ mentorshipRequest }, { status: 201 });
}
