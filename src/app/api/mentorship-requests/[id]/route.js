import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { ensureConversation } from "@/lib/conversations";

const VALID_STATUSES = ["ACCEPTED", "DECLINED"];

// PATCH /api/mentorship-requests/[id]
// Accept or decline a received mentorship request. Only the recipient may
// respond, and only while it's still PENDING.
export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const { status } = await request.json();

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: "status must be ACCEPTED or DECLINED" },
      { status: 400 }
    );
  }

  const existing = await prisma.mentorshipRequest.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }
  if (existing.receiverId !== session.user.id) {
    return NextResponse.json(
      { error: "Only the recipient can respond to this request" },
      { status: 403 }
    );
  }
  if (existing.status !== "PENDING") {
    return NextResponse.json(
      { error: "This request has already been responded to" },
      { status: 409 }
    );
  }

  const mentorshipRequest = await prisma.mentorshipRequest.update({
    where: { id },
    data: { status },
  });

  if (status === "ACCEPTED") {
    await ensureConversation(existing.senderId, existing.receiverId);
  }

  const responder = await prisma.profile.findUnique({ where: { userId: session.user.id }, select: { fullName: true } });
  await createNotification({
      userId: existing.senderId,
      type: `MENTORSHIP_${status}`,
      title: status === "ACCEPTED" ? "Mentorship request accepted" : "Mentorship request declined",
      message: `${responder?.fullName || "A stakeholder"} ${status === "ACCEPTED" ? "accepted" : "declined"} your mentorship request.`,
      href: "/requests",
  });

  return NextResponse.json({ mentorshipRequest });
}
