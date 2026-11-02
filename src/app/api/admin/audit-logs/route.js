import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readActivityNotes } from "@/lib/audit-log";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.min(50, Math.max(10, Number.parseInt(searchParams.get("pageSize") || "25", 10) || 25));
  const actorType = searchParams.get("actor") || "ALL";
  const query = searchParams.get("q")?.trim().slice(0, 100) || "";
  const where = { actionType: { not: "ADMIN_INVITE_SENT" } };
  if (actorType === "ADMIN") {
    where.OR = [
      { notes: { contains: '"actorType":"ADMIN"' } },
      { AND: [{ admin: { role: "ADMIN" } }, { NOT: { notes: { contains: '"actorType":"MEMBER"' } } }] },
    ];
  }
  if (actorType === "MEMBER") {
    where.OR = [
      { notes: { contains: '"actorType":"MEMBER"' } },
      { AND: [{ admin: { role: { not: "ADMIN" } } }, { NOT: { notes: { contains: '"actorType":"ADMIN"' } } }] },
    ];
  }
  if (query) {
    where.AND = [{
      OR: [
        { actionType: { contains: query, mode: "insensitive" } },
        { notes: { contains: query, mode: "insensitive" } },
        { targetId: { contains: query, mode: "insensitive" } },
        { admin: { email: { contains: query, mode: "insensitive" } } },
        { admin: { profile: { fullName: { contains: query, mode: "insensitive" } } } },
      ],
    }];
  }

  const [total, rows] = await Promise.all([
    prisma.adminAction.count({ where }),
    prisma.adminAction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { admin: { select: { id: true, email: true, role: true, profile: { select: { fullName: true } } } } },
    }),
  ]);
  const targetIds = [...new Set(rows.map((row) => row.targetId).filter(Boolean))];
  const targets = targetIds.length ? await prisma.user.findMany({
    where: { id: { in: targetIds } },
    select: { id: true, email: true, role: true, profile: { select: { fullName: true } } },
  }) : [];
  const targetsById = new Map(targets.map((user) => [user.id, user]));
  const logs = rows.map((row) => {
    const activity = readActivityNotes(row.notes, row.actionType);
    return {
      id: row.id,
      actionType: row.actionType,
      summary: activity.summary,
      details: activity.details,
      createdAt: row.createdAt,
      actor: {
        id: row.admin.id,
        name: row.admin.profile?.fullName || row.admin.email,
        email: row.admin.email,
        role: activity.actorRole || row.admin.role,
        actorType: activity.actorType || (row.admin.role === "ADMIN" ? "ADMIN" : "MEMBER"),
      },
      target: row.targetId ? targetsById.get(row.targetId) ? {
        id: targetsById.get(row.targetId).id,
        name: targetsById.get(row.targetId).profile?.fullName || targetsById.get(row.targetId).email,
        email: targetsById.get(row.targetId).email,
        role: targetsById.get(row.targetId).role,
      } : { id: row.targetId, name: null, email: null, role: null } : null,
    };
  });

  return NextResponse.json({ logs, page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
}
