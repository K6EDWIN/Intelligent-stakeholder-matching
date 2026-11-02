import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Admins only" }, { status: 403 });
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true, isVerified: true } });
  if (!user) return NextResponse.json({ error: "Invitation not found" }, { status: 404 });

  const sent = await prisma.adminAction.findMany({ where: { targetId: id, actionType: "ADMIN_INVITE_SENT" } });
  const accepted = await prisma.adminAction.findMany({ where: { actionType: "ADMIN_INVITE_ACCEPTED" }, select: { notes: true } });
  const acceptedIds = new Set(accepted.map((item) => {
    try { return JSON.parse(item.notes || "{}").inviteActionId; } catch { return null; }
  }).filter(Boolean));
  const pending = sent.filter((item) => !acceptedIds.has(item.id));
  if (!pending.length || user.role === "ADMIN" && user.isVerified) return NextResponse.json({ error: "There is no pending invitation to revoke." }, { status: 409 });

  const tokens = await prisma.verificationToken.findMany({ where: { userId: id }, select: { id: true, token: true } });
  const { createHash } = await import("node:crypto");
  const pendingHashes = new Set(pending.map((item) => item.notes));
  const inviteTokenIds = tokens.filter((item) => pendingHashes.has(createHash("sha256").update(item.token).digest("hex"))).map((item) => item.id);
  await prisma.$transaction(async (tx) => {
    if (inviteTokenIds.length) await tx.verificationToken.deleteMany({ where: { id: { in: inviteTokenIds } } });
    await tx.adminAction.deleteMany({ where: { id: { in: pending.map((item) => item.id) } } });
    if (user.role === "ADMIN" && !user.isVerified) await tx.user.delete({ where: { id } });
  });
  return NextResponse.json({ revoked: true });
}
