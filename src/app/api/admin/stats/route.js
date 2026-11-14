import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/stats
// Basic platform stats for the admin dashboard. Admin-only.
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const [
    totalUsers,
    verifiedUsers,
    suspendedUsers,
    usersByRoleRaw,
    mentorshipByStatus,
    connectionByStatus,
    totalEvents,
    totalOpportunities,
    totalRecommendations,
    recScoreAgg,
    feedbackAgg,
    totalFlightReconnects,
  ] = await Promise.all([
    prisma.user.count({ where: { isDemo: false } }),
    prisma.user.count({ where: { isVerified: true, isDemo: false } }),
    prisma.user.count({ where: { isSuspended: true, isDemo: false } }),
    typeof prisma.user.groupBy === "function"
      ? prisma.user.groupBy({ by: ["role"], where: { isDemo: false }, _count: true })
      : Promise.resolve([]),
    typeof prisma.mentorshipRequest?.groupBy === "function"
      ? prisma.mentorshipRequest.groupBy({ by: ["status"], where: { sender: { is: { isDemo: false } }, receiver: { is: { isDemo: false } } }, _count: true })
      : Promise.resolve([]),
    typeof prisma.connectionRequest?.groupBy === "function"
      ? prisma.connectionRequest.groupBy({ by: ["status"], where: { sender: { is: { isDemo: false } }, receiver: { is: { isDemo: false } } }, _count: true })
      : Promise.resolve([]),
    typeof prisma.event?.count === "function" ? prisma.event.count() : Promise.resolve(0),
    typeof prisma.opportunity?.count === "function"
      ? prisma.opportunity.count()
      : Promise.resolve(0),
    typeof prisma.recommendation?.count === "function"
      ? prisma.recommendation.count({ where: { owner: { isDemo: false }, matchedUser: { isDemo: false } } })
      : Promise.resolve(0),
    typeof prisma.recommendation?.aggregate === "function"
      ? prisma.recommendation.aggregate({
          _avg: { hybridScore: true, contentScore: true, collaborativeScore: true },
          where: { owner: { isDemo: false }, matchedUser: { isDemo: false } },
        })
      : Promise.resolve({ _avg: {} }),
    typeof prisma.feedback?.aggregate === "function"
      ? prisma.feedback.aggregate({
          _count: true,
          _avg: { rating: true },
          where: {
            user: { isDemo: false },
            feedbackType: { in: ["MENTORSHIP_USEFULNESS", "CONNECTION_USEFULNESS"] },
          },
        })
      : Promise.resolve({ _count: 0, _avg: { rating: 0 } }),
    typeof prisma.flightReconnect?.count === "function"
      ? prisma.flightReconnect.count({ where: { user: { isDemo: false } } })
      : Promise.resolve(0),
  ]);

  const toCountByStatus = (rows) =>
    Object.fromEntries(rows.map((r) => [r.status, r._count]));

  const toCountByRole = (rows) =>
    Object.fromEntries(rows.map((r) => [r.role, r._count]));

  return NextResponse.json({
    totalUsers,
    verifiedUsers,
    suspendedUsers,
    usersByRole: toCountByRole(usersByRoleRaw),
    mentorshipRequestsByStatus: toCountByStatus(mentorshipByStatus),
    connectionRequestsByStatus: toCountByStatus(connectionByStatus),
    totalEvents,
    totalOpportunities,
    totalRecommendations,
    totalFlightReconnects,
    avgRecommendationScore: {
      hybrid: recScoreAgg?._avg?.hybridScore != null ? +(recScoreAgg._avg.hybridScore * 100).toFixed(1) : 0,
      content: recScoreAgg?._avg?.contentScore != null ? +(recScoreAgg._avg.contentScore * 100).toFixed(1) : 0,
      collaborative: recScoreAgg?._avg?.collaborativeScore != null ? +(recScoreAgg._avg.collaborativeScore * 100).toFixed(1) : 0,
    },
    feedbackStats: {
      total: feedbackAgg?._count || 0,
      avgRating: feedbackAgg?._avg?.rating != null ? +feedbackAgg._avg.rating.toFixed(2) : 0,
    },
  });
}
