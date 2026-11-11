import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { ensureConversation } from "@/lib/conversations";
import { logActivity } from "@/lib/audit-log";

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
  const body = await request.json().catch(() => ({}));
  const existing = await prisma.mentorshipRequest.findUnique({ where: { id } });

  if (!existing) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  if (body.completed === true) {
    if (![existing.senderId, existing.receiverId].includes(session.user.id)) {
      return NextResponse.json({ error: "Only participants can report mentorship completion" }, { status: 403 });
    }
    if (existing.status !== "ACCEPTED") {
      return NextResponse.json({ error: "Only accepted mentorships can be completed" }, { status: 409 });
    }
    if (existing.completedAt) {
      return NextResponse.json({ mentorshipRequest: existing });
    }
    const mentorshipRequest = await prisma.mentorshipRequest.update({ where: { id }, data: { completedAt: new Date() } });
    const counterpartId = existing.senderId === session.user.id ? existing.receiverId : existing.senderId;
    await createNotification({
      userId: counterpartId,
      type: "MENTORSHIP_COMPLETED",
      title: "Mentorship marked complete",
      message: "Your mentorship partner marked this mentorship as complete. You can both leave a private usefulness rating.",
      href: "/requests",
    });
    await logActivity({
      actorId: session.user.id,
      targetId: counterpartId,
      actionType: "MENTORSHIP_COMPLETED",
      summary: "Marked an accepted mentorship as complete",
      details: { requestId: id },
    });
    return NextResponse.json({ mentorshipRequest });
  }

  const { status } = body;

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: "status must be ACCEPTED or DECLINED" },
      { status: 400 }
    );
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

  const senderProfile = await prisma.profile.findUnique({ where: { userId: existing.senderId }, select: { fullName: true } });
  await logActivity({
    actorId: session.user.id,
    targetId: existing.senderId,
    actionType: `MENTORSHIP_REQUEST_${status}`,
    summary: `${status === "ACCEPTED" ? "Accepted" : "Declined"} ${senderProfile?.fullName || "a member"}’s mentorship request`,
    details: { requestId: mentorshipRequest.id, requestStatus: status },
  });

  return NextResponse.json({ mentorshipRequest });
}
