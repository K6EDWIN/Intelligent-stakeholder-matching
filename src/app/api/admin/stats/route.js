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
    mentorshipByStatus,
    connectionByStatus,
    totalEvents,
    totalOpportunities,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isVerified: true } }),
    prisma.user.count({ where: { isSuspended: true } }),
    prisma.mentorshipRequest.groupBy({ by: ["status"], _count: true }),
    prisma.connectionRequest.groupBy({ by: ["status"], _count: true }),
    prisma.event.count(),
    prisma.opportunity.count(),
  ]);

  const toCountByStatus = (rows) =>
    Object.fromEntries(rows.map((r) => [r.status, r._count]));

  return NextResponse.json({
    totalUsers,
    verifiedUsers,
    suspendedUsers,
    mentorshipRequestsByStatus: toCountByStatus(mentorshipByStatus),
    connectionRequestsByStatus: toCountByStatus(connectionByStatus),
    totalEvents,
    totalOpportunities,
  });
}
