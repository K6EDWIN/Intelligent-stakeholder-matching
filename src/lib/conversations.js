import { prisma } from "@/lib/prisma";

export function orderedParticipants(userA, userB) {
  return userA < userB
    ? { participantOneId: userA, participantTwoId: userB }
    : { participantOneId: userB, participantTwoId: userA };
}

export async function ensureConversation(userA, userB) {
  const participants = orderedParticipants(userA, userB);
  return prisma.conversation.upsert({
    where: { participantOneId_participantTwoId: participants },
    update: {},
    create: participants,
  });
}

export async function hasAcceptedRelationship(userA, userB) {
  const [connection, mentorship] = await Promise.all([
    prisma.connectionRequest.findFirst({
      where: {
        status: "ACCEPTED",
        OR: [
          { senderId: userA, receiverId: userB },
          { senderId: userB, receiverId: userA },
        ],
      },
      select: { id: true },
    }),
    prisma.mentorshipRequest.findFirst({
      where: {
        status: "ACCEPTED",
        OR: [
          { senderId: userA, receiverId: userB },
          { senderId: userB, receiverId: userA },
        ],
      },
      select: { id: true },
    }),
  ]);
  return Boolean(connection || mentorship);
}
