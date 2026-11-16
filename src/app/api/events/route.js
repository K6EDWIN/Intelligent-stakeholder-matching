import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit-log";
import { sendAppEmail, GMAIL_SENDER } from "@/lib/gmail";
import { buildAppUrl, escapeHtml } from "@/lib/app-url";

// GET /api/events
// Lists all events, soonest first, with participant count and whether the
// logged-in user has already joined.
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const events = await prisma.event.findMany({
    where: { isHidden: false, createdBy: { isDeleted: false } },
    include: {
      createdBy: { select: { id: true, profile: { select: { fullName: true } } } },
      participants: { select: { userId: true } },
    },
    orderBy: { eventDate: "asc" },
  });

  const withRsvpInfo = events.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    location: e.location,
    bannerUrl: e.bannerUrl,
    eventDate: e.eventDate,
    isPast: e.eventDate < new Date(),
    createdByName: e.createdBy?.profile?.fullName || "Unknown",
    participantCount: e.participants.length,
    isJoined: e.participants.some((p) => p.userId === session.user.id),
  }));

  return NextResponse.json({ events: withRsvpInfo });
}

// POST /api/events
// Creates a new event.
export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Enter valid event details and try again." }, { status: 400 });
  }
  const { title, description, location, eventDate, bannerUrl } = payload || {};

  if (typeof title !== "string" || !title.trim() || !eventDate) {
    return NextResponse.json(
      { error: "title and eventDate are required" },
      { status: 400 }
    );
  }

  const parsedDate = new Date(eventDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return NextResponse.json({ error: "eventDate is invalid" }, { status: 400 });
  }
  if (parsedDate <= new Date()) {
    return NextResponse.json({ error: "Choose a future date and time for the event." }, { status: 400 });
  }
  if (bannerUrl) {
    let parsedBanner;
    try { parsedBanner = new URL(bannerUrl); } catch { parsedBanner = null; }
    if (typeof bannerUrl !== "string" || parsedBanner?.protocol !== "https:" || parsedBanner.username || parsedBanner.password || !parsedBanner.hostname.endsWith(".public.blob.vercel-storage.com")) {
      return NextResponse.json({ error: "Upload the banner again before publishing." }, { status: 400 });
    }
  }

  const event = await prisma.event.create({ data: {
    createdById: session.user.id,
    title: title.trim(),
    description: typeof description === "string" ? description.trim() || null : null,
    location: typeof location === "string" ? location.trim() || null : null,
    bannerUrl: bannerUrl || null,
    eventDate: parsedDate,
  } });

  await logActivity({
    actorId: session.user.id,
    targetId: session.user.id,
    actionType: "EVENT_CREATED",
    summary: `Created the event “${event.title}”`,
    details: { eventId: event.id, title: event.title, eventDate: parsedDate.toISOString(), location: location || null },
  });

  let announcement = { sent: false, recipientCount: 0 };
  let recipients = [];
  try {
    const members = await prisma.user.findMany({
      where: { isVerified: true, isDeleted: false, isSuspended: false, isDemo: false, id: { not: session.user.id } },
      select: { email: true },
    });
    recipients = [...new Set(members.map((member) => member.email).filter(Boolean))];
    const eventUrl = buildAppUrl("/events", { eventId: event.id });
    const safeTitle = escapeHtml(event.title);
    const safeDescription = escapeHtml(event.description || "Join the community for this event.").replace(/\n/g, "<br>");
    const safeLocation = escapeHtml(event.location || "Details to be announced");
    const safeDate = escapeHtml(parsedDate.toLocaleString("en-KE", { dateStyle: "full", timeStyle: "short", timeZone: "Africa/Nairobi" }));
    const banner = event.bannerUrl ? `<p><img src="${escapeHtml(event.bannerUrl)}" alt="${safeTitle} banner" style="display:block;width:100%;max-width:640px;height:auto;border-radius:12px"></p>` : "";
    const html = `<div style="font-family:Arial,sans-serif;color:#14243a;max-width:640px;margin:auto"><p style="color:#c8102e;font-weight:bold">NEW EVENT POSTED</p><h1>${safeTitle}</h1>${banner}<p>${safeDescription}</p><p><strong>When:</strong> ${safeDate}<br><strong>Where:</strong> ${safeLocation}</p><p><a href="${escapeHtml(eventUrl)}" style="display:inline-block;background:#c8102e;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none">View event</a></p></div>`;
    const text = `NEW EVENT POSTED: ${event.title}\n\n${event.description || "Join the community for this event."}\n\nWhen: ${parsedDate.toLocaleString("en-KE", { dateStyle: "full", timeStyle: "short", timeZone: "Africa/Nairobi" })}\nWhere: ${event.location || "Details to be announced"}\n${event.bannerUrl ? `Banner: ${event.bannerUrl}\n` : ""}\nView event: ${eventUrl}`;
    let sentCount = 0;
    for (let index = 0; index < recipients.length; index += 40) {
      await sendAppEmail({ to: GMAIL_SENDER, bcc: recipients.slice(index, index + 40), subject: `New event posted: ${event.title.replace(/[\r\n]+/g, " ").slice(0, 160)}`, html, text });
      sentCount += recipients.slice(index, index + 40).length;
      announcement = { sent: false, recipientCount: sentCount };
    }
    announcement = { sent: recipients.length > 0, recipientCount: sentCount };
  } catch (error) {
    console.error("Event was published, but the member announcement could not be sent:", error);
    announcement = { sent: false, recipientCount: announcement.recipientCount, totalRecipients: recipients.length, failed: true };
  }

  return NextResponse.json({ event, announcement }, { status: 201 });
}
