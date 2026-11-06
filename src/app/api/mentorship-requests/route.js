import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractPairFeatures } from "@/lib/adaptive-recommender";
import { buildConnectionsByUser, computeCollaborativeScore } from "@/lib/collaborative";
import { createNotification } from "@/lib/notifications";
import { logActivity } from "@/lib/audit-log";

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

  const body = await request.json().catch(() => ({}));
  const receiverId = body.receiverId || body.userId || body.targetUserId;
  const message = body.message;

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
  if (session.user.role === "ADMIN") {
    return NextResponse.json({ error: "Administrator accounts do not join the mentorship network" }, { status: 403 });
  }

  const [receiver, senderProfile, acceptedMentorships, acceptedConnections] = await Promise.all([
    prisma.user.findUnique({
      where: { id: receiverId },
      include: {
        profile: {
          include: { skills: { include: { skill: true } }, interests: { include: { interest: true } } },
        },
      },
    }),
    prisma.profile.findUnique({
      where: { userId: session.user.id },
      include: { skills: { include: { skill: true } }, interests: { include: { interest: true } } },
    }),
    prisma.mentorshipRequest.findMany({
      where: { status: "ACCEPTED" },
      select: { senderId: true, receiverId: true },
    }),
    prisma.connectionRequest.findMany({
      where: { status: "ACCEPTED" },
      select: { senderId: true, receiverId: true },
    }),
  ]);
  if (!receiver) {
    return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
  }
  if (receiver.role === "ADMIN") {
    return NextResponse.json({ error: "Administrator accounts are not available for mentorship matching" }, { status: 403 });
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
      modelFeatures: senderProfile && receiver.profile
        ? extractPairFeatures(
            senderProfile,
            receiver.profile,
            "MENTORSHIP",
            computeCollaborativeScore(
              buildConnectionsByUser([...acceptedMentorships, ...acceptedConnections]),
              session.user.id,
              receiverId
            )
          )
        : undefined,
    },
  });

  await createNotification({
      userId: receiverId,
      type: "MENTORSHIP_REQUEST",
      title: "New mentorship request",
      message: `${senderProfile?.fullName || "A stakeholder"} sent you a mentorship request.`,
      href: "/requests",
  });

  await logActivity({
    actorId: session.user.id,
    targetId: receiverId,
    actionType: "MENTORSHIP_REQUEST_SENT",
    summary: `Sent a mentorship request to ${receiver.profile?.fullName || "another member"}`,
    details: { requestId: mentorshipRequest.id, requestStatus: mentorshipRequest.status },
  });

  return NextResponse.json({ mentorshipRequest }, { status: 201 });
}
