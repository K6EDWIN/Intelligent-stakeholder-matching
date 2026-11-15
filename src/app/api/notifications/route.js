import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function notificationFailure(error) {
  console.error("Notifications request failed:", error);
  const schemaMismatch = ["P2021", "P2022"].includes(error?.code)
    || ["42P01", "42703"].includes(error?.meta?.code);
  const databaseUnavailable = ["P1001", "P1002", "P1017"].includes(error?.code);
  return NextResponse.json({
    error: schemaMismatch
      ? "Notifications are unavailable because the database migration has not been applied."
      : databaseUnavailable
        ? "Notifications are temporarily unavailable. Try again shortly."
        : "Could not load or update notifications. Please try again.",
    code: schemaMismatch ? "DATABASE_SCHEMA_OUT_OF_DATE" : databaseUnavailable ? "DATABASE_UNAVAILABLE" : "NOTIFICATIONS_FAILED",
  }, { status: 500 });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, take: 50 }),
      prisma.notification.count({ where: { userId: session.user.id, readAt: null } }),
    ]);
    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    return notificationFailure(error);
  }
}

export async function PATCH(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { id, markAll } = await request.json().catch(() => ({}));
  const where = { userId: session.user.id, readAt: null };
  if (!markAll && !id) return NextResponse.json({ error: "Notification id is required" }, { status: 400 });
  if (id) where.id = id;
  try {
    const result = await prisma.notification.updateMany({ where, data: { readAt: new Date() } });
    return NextResponse.json({ updated: result.count });
  } catch (error) {
    return notificationFailure(error);
  }
}
