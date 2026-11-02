import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const hashToken = (token) => createHash("sha256").update(token).digest("hex");

async function findValidInvite(token) {
  if (typeof token !== "string" || token.length !== 64) return null;
  const verification = await prisma.verificationToken.findUnique({ where: { token }, include: { user: { select: { id: true, email: true, role: true, isSuspended: true } } } });
  if (!verification || verification.expiresAt < new Date() || verification.user.isSuspended) return null;
  const inviteAction = await prisma.adminAction.findFirst({
    where: { targetId: verification.userId, actionType: "ADMIN_INVITE_SENT", notes: hashToken(token) },
  });
  if (!inviteAction) return null;
  const acceptedActions = await prisma.adminAction.findMany({
    where: { actionType: "ADMIN_INVITE_ACCEPTED", adminId: verification.userId },
    select: { notes: true },
  });
  const wasAccepted = acceptedActions.some((action) => {
    try { return JSON.parse(action.notes || "{}").inviteActionId === inviteAction.id; } catch { return false; }
  });
  return wasAccepted ? null : { verification, inviteAction };
}

export async function GET(request) {
  const token = new URL(request.url).searchParams.get("token");
  const invite = await findValidInvite(token);
  if (!invite) return NextResponse.json({ error: "This administrator invitation is invalid or has expired. Ask an administrator to send a new one." }, { status: 410 });
  return NextResponse.json({ email: invite.verification.user.email, expiresAt: invite.verification.expiresAt });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { token, password, confirmPassword } = body;
  if (typeof password !== "string" || password.length < 8 || password.length > 128) {
    return NextResponse.json({ error: "Choose a password between 8 and 128 characters." }, { status: 400 });
  }
  if (password !== confirmPassword) return NextResponse.json({ error: "The passwords do not match." }, { status: 400 });
  const invite = await findValidInvite(token);
  if (!invite) return NextResponse.json({ error: "This administrator invitation is invalid or has expired. Ask an administrator to send a new one." }, { status: 410 });
  const passwordHash = await bcrypt.hash(password, 10);
  const previousRole = invite.verification.user.role === "ADMIN" ? "STAFF" : invite.verification.user.role;

  try {
    await prisma.$transaction(async (tx) => {
      const currentToken = await tx.verificationToken.findUnique({ where: { id: invite.verification.id } });
      if (!currentToken || currentToken.expiresAt < new Date()) throw new Error("INVITATION_EXPIRED");
      const currentAction = await tx.adminAction.findFirst({ where: { id: invite.inviteAction.id, notes: hashToken(token), actionType: "ADMIN_INVITE_SENT" } });
      if (!currentAction) throw new Error("INVITATION_REVOKED");
      await tx.user.update({ where: { id: invite.verification.user.id }, data: { passwordHash, role: "ADMIN", isVerified: true } });
      const removed = await tx.verificationToken.deleteMany({ where: { id: currentToken.id } });
      if (removed.count !== 1) throw new Error("INVITATION_ALREADY_USED");
      await tx.adminAction.create({
        data: {
          adminId: invite.verification.user.id,
          actionType: "ADMIN_INVITE_ACCEPTED",
          targetId: invite.verification.user.id,
          notes: JSON.stringify({
            version: 1,
            actorRole: "ADMIN",
            actorType: "ADMIN",
            inviteActionId: currentAction.id,
            previousRole,
            summary: "Accepted an administrator invitation and activated admin access",
            details: { invitedEmail: invite.verification.user.email, previousRole, newRole: "ADMIN", passwordCreated: true, googleSignInAvailable: true },
          }),
        },
      });
    });
  } catch (error) {
    const message = error.message?.startsWith("INVITATION_") ? "This invitation is invalid, expired, revoked, or already used. Ask an administrator to send a new one." : "Could not activate the administrator account. Please try again.";
    return NextResponse.json({ error: message }, { status: 409 });
  }

  return NextResponse.json({ message: "Administrator access is active. You can now sign in with Google using this invited email or use the password you created." });
}
