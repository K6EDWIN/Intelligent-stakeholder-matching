import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMlUserKey, isAuthorizedMlSyncRequest } from "@/lib/ml-sync-auth";

export const dynamic = "force-dynamic";

// Export numeric feature snapshots and keyed user pseudonyms only. Never export
// account IDs, profile text, email addresses, or request messages to Colab.
export async function GET(request) {
  if (!isAuthorizedMlSyncRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [mentorship, connections, feedback] = await Promise.all([
      prisma.mentorshipRequest.findMany({
        where: { status: { in: ["ACCEPTED", "DECLINED"] } },
        select: { status: true, modelFeatures: true, senderId: true, receiverId: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 10000,
      }),
      prisma.connectionRequest.findMany({
        where: { status: { in: ["ACCEPTED", "DECLINED"] } },
        select: { status: true, modelFeatures: true, senderId: true, receiverId: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 10000,
      }),
      prisma.feedback.findMany({
        where: { recommendationId: { not: null }, OR: [{ rating: { gte: 4 } }, { rating: { lte: 2 } }] },
        select: { rating: true, modelFeatures: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 10000,
      }),
    ]);

    const acceptance = [...mentorship, ...connections]
      .filter((row) => row.modelFeatures && typeof row.modelFeatures === "object")
      .map((row) => ({ features: row.modelFeatures, label: row.status === "ACCEPTED" ? 1 : 0, timestamp: row.updatedAt }));
    const relevance = feedback
      .filter((row) => row.modelFeatures && typeof row.modelFeatures === "object")
      .map((row) => ({ features: row.modelFeatures, label: row.rating >= 4 ? 1 : 0, timestamp: row.createdAt }));
    const ncfExamples = [
      ...mentorship.map((row) => ({ row, isMentorship: true })),
      ...connections.map((row) => ({ row, isMentorship: false })),
    ]
      .filter(({ row }) => getMlUserKey(row.senderId) && getMlUserKey(row.receiverId))
      .map(({ row, isMentorship }) => ({
        senderKey: getMlUserKey(row.senderId),
        recipientKey: getMlUserKey(row.receiverId),
        isMentorship,
        label: row.status === "ACCEPTED" ? 1 : 0,
        timestamp: row.updatedAt,
      }));

    return NextResponse.json({ featureNames: ["skillOverlap", "interestOverlap", "sameDepartment", "mentorshipRoleFit", "sharedNetwork", "isMentorshipRequest", "semanticProfileOverlap"], acceptance, relevance, ncf: ncfExamples }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("ML training export failed:", error);
    return NextResponse.json({ error: "Could not load training examples" }, { status: 500 });
  }
}
