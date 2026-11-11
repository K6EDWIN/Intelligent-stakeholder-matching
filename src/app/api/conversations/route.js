import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureConversation } from "@/lib/conversations";

const participantInclude = {
  select: { id: true, email: true, profile: { select: { fullName: true, department: true } } },
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const userId = session.user.id;
  const [connections, mentorships] = await Promise.all([
    prisma.connectionRequest.findMany({
      where: { status: "ACCEPTED", sender: { is: { isDemo: false } }, receiver: { is: { isDemo: false } }, OR: [{ senderId: userId }, { receiverId: userId }] },
      select: { senderId: true, receiverId: true },
    }),
    prisma.mentorshipRequest.findMany({
      where: { status: "ACCEPTED", sender: { is: { isDemo: false } }, receiver: { is: { isDemo: false } }, OR: [{ senderId: userId }, { receiverId: userId }] },
      select: { senderId: true, receiverId: true },
    }),
  ]);

  // Materialize conversations for accepted relationships created before chat
  // was introduced, so existing members can start messaging immediately.
  const counterpartIds = [...new Set([...connections, ...mentorships].map((item) =>
    item.senderId === userId ? item.receiverId : item.senderId
  ))];
  await Promise.all(counterpartIds.map((counterpartId) => ensureConversation(userId, counterpartId)));

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [
        { participantOneId: userId, participantTwo: { is: { isDemo: false } } },
        { participantTwoId: userId, participantOne: { is: { isDemo: false } } },
      ],
    },
    include: {
      participantOne: participantInclude,
      participantTwo: participantInclude,
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true, createdAt: true, senderId: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({
    conversations: conversations.map((conversation) => ({
      id: conversation.id,
      partner: conversation.participantOneId === userId ? conversation.participantTwo : conversation.participantOne,
      lastMessage: conversation.messages[0] || null,
      updatedAt: conversation.updatedAt,
    })),
  });
}
