import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.notification.count({ where: { userId: session.user.id, readAt: null } }),
  ]);
  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { id, markAll } = await request.json().catch(() => ({}));
  const where = { userId: session.user.id, readAt: null };
  if (!markAll && !id) return NextResponse.json({ error: "Notification id is required" }, { status: 400 });
  if (id) where.id = id;
  const result = await prisma.notification.updateMany({ where, data: { readAt: new Date() } });
  return NextResponse.json({ updated: result.count });
}
