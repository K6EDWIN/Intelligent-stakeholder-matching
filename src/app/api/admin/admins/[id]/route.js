import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_ROLES = new Set(["ALUMNI", "STAFF", "FORMER_STAFF", "FREQUENT_FLYER"]);

export async function DELETE(_request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Admins only" }, { status: 403 });
  const { id } = await params;
  if (id === session.user.id) return NextResponse.json({ error: "You cannot remove your own administrator access." }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { id }, select: { id: true, email: true, role: true } });
  if (!target || target.role !== "ADMIN") return NextResponse.json({ error: "Administrator account not found." }, { status: 404 });
  const adminCount = await prisma.user.count({ where: { role: "ADMIN", isVerified: true } });
  if (adminCount <= 1) return NextResponse.json({ error: "The last active administrator cannot be removed." }, { status: 409 });

  const acceptance = await prisma.adminAction.findFirst({ where: { adminId: id, actionType: "ADMIN_INVITE_ACCEPTED" }, orderBy: { createdAt: "desc" }, select: { notes: true } });
  let restoreRole = "STAFF";
  try {
    const parsed = JSON.parse(acceptance?.notes || "{}");
    if (VALID_ROLES.has(parsed.previousRole)) restoreRole = parsed.previousRole;
  } catch { /* Older administrator records default back to staff. */ }

  await prisma.$transaction([
    prisma.user.update({ where: { id }, data: { role: restoreRole } }),
    prisma.adminAction.create({ data: { adminId: session.user.id, targetId: id, actionType: "ADMIN_ACCESS_REMOVED", notes: `Restored role ${restoreRole} for ${target.email}` } }),
  ]);
  return NextResponse.json({ removed: true, restoredRole: restoreRole });
}
