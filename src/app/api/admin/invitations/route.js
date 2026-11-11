import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GMAIL_SENDER, sendAppEmail } from "@/lib/gmail";
import { logActivity } from "@/lib/audit-log";
import { buildAppUrl, escapeHtml } from "@/lib/app-url";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INVITE_SENT = "ADMIN_INVITE_SENT";
const INVITE_ACCEPTED = "ADMIN_INVITE_ACCEPTED";

function tokenHash(token) {
  return createHash("sha256").update(token).digest("hex");
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  if (session.user.role !== "ADMIN") return { response: NextResponse.json({ error: "Admins only" }, { status: 403 }) };
  return { session };
}

export async function GET() {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const [admins, sentInvites, acceptedInvites] = await Promise.all([
    prisma.user.findMany({
      where: { role: "ADMIN", isVerified: true },
      select: { id: true, email: true, isVerified: true, createdAt: true, profile: { select: { fullName: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.adminAction.findMany({
      where: { actionType: INVITE_SENT },
      include: { admin: { select: { profile: { select: { fullName: true } }, email: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.adminAction.findMany({ where: { actionType: INVITE_ACCEPTED }, select: { notes: true } }),
  ]);
  const acceptedActionIds = new Set(acceptedInvites.map((action) => {
    try { return JSON.parse(action.notes || "{}").inviteActionId; } catch { return null; }
  }).filter(Boolean));
  const pendingActions = sentInvites.filter((action) => !acceptedActionIds.has(action.id));
  const pendingIds = [...new Set(pendingActions.map((action) => action.targetId).filter(Boolean))];
  const [pendingUsers, tokens] = pendingIds.length ? await Promise.all([
    prisma.user.findMany({ where: { id: { in: pendingIds } }, select: { id: true, email: true, role: true, isVerified: true } }),
    prisma.verificationToken.findMany({ where: { userId: { in: pendingIds } }, select: { userId: true, token: true, expiresAt: true } }),
  ]) : [[], []];
  const usersById = new Map(pendingUsers.map((user) => [user.id, user]));
  const tokenByHash = new Map(tokens.map((item) => [tokenHash(item.token), item]));
  const latestByUser = new Map();
  for (const action of pendingActions) {
    const user = usersById.get(action.targetId);
    if (!user || user.role === "ADMIN" && user.isVerified || latestByUser.has(user.id)) continue;
    const token = tokenByHash.get(action.notes);
    latestByUser.set(user.id, {
      id: user.id,
      email: user.email,
      invitedAt: action.createdAt,
      expiresAt: token?.expiresAt || null,
      expired: !token || token.expiresAt < new Date(),
      invitedBy: action.admin.profile?.fullName || action.admin.email,
    });
  }

  return NextResponse.json({ admins, invitations: [...latestByUser.values()], currentAdminId: session.user.id });
}

export async function POST(request) {
  const { session, response } = await requireAdmin();
  if (response) return response;
  if (!process.env.GMAIL_APP_PASSWORD) {
    return NextResponse.json({ error: "Email delivery is not configured. Add GMAIL_APP_PASSWORD before sending administrator invitations." }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  let user = await prisma.user.findUnique({ where: { email }, include: { profile: true } });
  if (user?.role === "ADMIN" && user.isVerified) {
    return NextResponse.json({ error: "This account already has administrator access." }, { status: 409 });
  }
  if (user?.isSuspended) {
    return NextResponse.json({ error: "This account is suspended. Resolve its account status before inviting it." }, { status: 409 });
  }

  let inviteBaseUrl;
  try {
    inviteBaseUrl = buildAppUrl("/admin-invite/accept");
  } catch (error) {
    console.error("Administrator invitation URL is not configured:", error);
    return NextResponse.json({ error: "Email links are not configured. Set APP_URL to the public site address and redeploy." }, { status: 503 });
  }

  let createdUser = false;
  if (!user) {
    const displayName = email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()).slice(0, 100) || "Administrator";
    user = await prisma.user.create({
      data: {
        email,
        passwordHash: "",
        role: "ADMIN",
        isVerified: false,
        profile: { create: { fullName: displayName, department: "Platform Administration", isPublic: false } },
      },
      include: { profile: true },
    });
    createdUser = true;
  }

  const token = randomBytes(32).toString("hex");
  const hashedToken = tokenHash(token);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const priorInvites = await prisma.adminAction.findMany({
    where: { targetId: user.id, actionType: INVITE_SENT },
    orderBy: { createdAt: "desc" },
  });
  const accepted = await prisma.adminAction.findMany({ where: { actionType: INVITE_ACCEPTED }, select: { notes: true } });
  const acceptedIds = new Set(accepted.map((entry) => {
    try { return JSON.parse(entry.notes || "{}").inviteActionId; } catch { return null; }
  }).filter(Boolean));
  const pendingInvite = priorInvites.find((action) => !acceptedIds.has(action.id));
  const previousAction = pendingInvite
    ? await prisma.adminAction.update({ where: { id: pendingInvite.id }, data: { adminId: session.user.id, notes: hashedToken } })
    : await prisma.adminAction.create({ data: { adminId: session.user.id, actionType: INVITE_SENT, targetId: user.id, notes: hashedToken } });
  await prisma.verificationToken.create({ data: { userId: user.id, token, expiresAt } });

  const inviteUrl = new URL(inviteBaseUrl);
  inviteUrl.searchParams.set("token", token);
  const inviter = session.user.name || session.user.email || "A KQ PrideConnect administrator";
  const safeInviter = escapeHtml(inviter);

  try {
    await sendAppEmail({
      to: email,
      subject: "You’re invited to administer KQ PrideConnect",
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#10243a;line-height:1.6"><div style="background:#071626;color:#fff;padding:24px;border-radius:14px 14px 0 0"><p style="margin:0;color:#ff6b80;font-size:12px;font-weight:bold;letter-spacing:2px">KQ PRIDECONNECT</p><h1 style="margin:10px 0 0;font-size:24px">Administrator invitation</h1></div><div style="padding:26px;border:1px solid #dce5ef;border-top:0;border-radius:0 0 14px 14px"><p>${safeInviter} invited you to help administer the Kenya Airways stakeholder network.</p><p>To activate your access, confirm this invitation and create an account password. Once activated, you can also sign in with Google using <b>${escapeHtml(email)}</b>. Your Google account email must match this invitation.</p><p><a href="${escapeHtml(inviteUrl.toString())}" style="display:inline-block;background:#c8102e;color:#fff;text-decoration:none;font-weight:bold;padding:12px 18px;border-radius:8px">Accept invitation &amp; set password</a></p><p style="font-size:13px;color:#5b6b7d">This one-time invitation expires in 24 hours. If you did not expect it, you can ignore this message.</p></div></div>`,
    });
  } catch (error) {
    await prisma.verificationToken.deleteMany({ where: { userId: user.id, token } });
    if (pendingInvite) await prisma.adminAction.update({ where: { id: pendingInvite.id }, data: { adminId: pendingInvite.adminId, notes: pendingInvite.notes } });
    else await prisma.adminAction.delete({ where: { id: previousAction.id } });
    if (createdUser) await prisma.user.delete({ where: { id: user.id } });
    console.error("Administrator invitation email failed:", error);
    return NextResponse.json({ error: "The invitation could not be emailed. Check GMAIL_USER and GMAIL_APP_PASSWORD, then try again." }, { status: 502 });
  }

  await logActivity({
    actorId: session.user.id,
    actionType: "ADMIN_INVITATION_SENT",
    targetId: user.id,
    summary: `Sent an administrator invitation to ${email}`,
    details: { invitedEmail: email, expiresAt: expiresAt.toISOString(), delivery: `Gmail (${GMAIL_SENDER})` },
  });

  return NextResponse.json({ message: `Invitation sent to ${email}.`, expiresAt }, { status: 201 });
}
