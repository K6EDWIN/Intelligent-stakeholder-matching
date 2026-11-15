import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/audit-log";

const ACTIONS = ["DISMISS", "SUSPEND_USER", "HIDE_CONTENT"];

function reportsFailure(error) {
  console.error("Could not load community reports:", error);
  const schemaMismatch = ["P2021", "P2022"].includes(error?.code)
    || ["42P01", "42703"].includes(error?.meta?.code)
    || /relation .* does not exist|column .* does not exist/i.test(error?.message || "");
  return NextResponse.json({
    error: schemaMismatch
      ? "Community reports are unavailable because the database migration has not been applied."
      : "Could not load community reports. Please try again.",
    code: schemaMismatch ? "REPORTS_SCHEMA_OUT_OF_DATE" : "REPORTS_LOAD_FAILED",
  }, { status: 500 });
}

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "OPEN";
  if (!["OPEN", "ACTIONED", "DISMISSED", "ALL"].includes(status)) {
    return NextResponse.json({ error: "Invalid report status" }, { status: 400 });
  }
  try {
    const reports = await prisma.report.findMany({
      where: status === "ALL" ? {} : { status },
      include: {
        reporter: { select: { id: true, isDeleted: true, profile: { select: { fullName: true } } } },
        moderator: { select: { id: true, profile: { select: { fullName: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const reportsWithTargets = await Promise.all(reports.map(async (report) => {
      let target = null;
      if (report.targetType === "USER") {
        const user = await prisma.user.findUnique({
          where: { id: report.targetId },
          select: { isDeleted: true, profile: { select: { fullName: true } } },
        });
        target = user?.isDeleted ? "Deleted member" : user?.profile?.fullName || null;
      } else if (report.targetType === "OPPORTUNITY") {
        target = (await prisma.opportunity.findUnique({ where: { id: report.targetId }, select: { title: true } }))?.title || null;
      } else {
        target = (await prisma.event.findUnique({ where: { id: report.targetId }, select: { title: true } }))?.title || null;
      }
      return { ...report, targetLabel: target };
    }));
    return NextResponse.json({ reports: reportsWithTargets });
  } catch (error) {
    return reportsFailure(error);
  }
}

export async function PATCH(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { reportId, action, moderatorNote } = body;
  if (typeof reportId !== "string" || !ACTIONS.includes(action)) {
    return NextResponse.json({ error: "A report and valid moderation action are required" }, { status: 400 });
  }
  if (moderatorNote != null && (typeof moderatorNote !== "string" || moderatorNote.length > 1000)) {
    return NextResponse.json({ error: "Moderator notes must be 1000 characters or fewer" }, { status: 400 });
  }

  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });
  if (report.status !== "OPEN") return NextResponse.json({ error: "This report has already been reviewed" }, { status: 409 });
  if (action === "SUSPEND_USER" && report.targetType !== "USER") {
    return NextResponse.json({ error: "Only a user report can suspend an account" }, { status: 400 });
  }
  if (action === "HIDE_CONTENT" && !["OPPORTUNITY", "EVENT"].includes(report.targetType)) {
    return NextResponse.json({ error: "Only an opportunity or event report can hide content" }, { status: 400 });
  }

  if (action === "SUSPEND_USER") {
    const target = await prisma.user.findFirst({
      where: { id: report.targetId, isDemo: false, isDeleted: false, role: { not: "ADMIN" } },
      select: { id: true },
    });
    if (!target) return NextResponse.json({ error: "Report target is unavailable" }, { status: 404 });
  }
  if (action === "HIDE_CONTENT" && report.targetType === "OPPORTUNITY") {
    if (!await prisma.opportunity.findUnique({ where: { id: report.targetId }, select: { id: true } })) {
      return NextResponse.json({ error: "Report target is unavailable" }, { status: 404 });
    }
  }
  if (action === "HIDE_CONTENT" && report.targetType === "EVENT") {
    if (!await prisma.event.findUnique({ where: { id: report.targetId }, select: { id: true } })) {
      return NextResponse.json({ error: "Report target is unavailable" }, { status: 404 });
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (action === "SUSPEND_USER") {
        await tx.user.update({ where: { id: report.targetId }, data: { isSuspended: true } });
      }
      if (action === "HIDE_CONTENT" && report.targetType === "OPPORTUNITY") {
        await tx.opportunity.update({ where: { id: report.targetId }, data: { isHidden: true } });
      }
      if (action === "HIDE_CONTENT" && report.targetType === "EVENT") {
        await tx.event.update({ where: { id: report.targetId }, data: { isHidden: true } });
      }
      const updated = await tx.report.updateMany({
        where: { id: report.id, status: "OPEN" },
        data: {
          status: action === "DISMISS" ? "DISMISSED" : "ACTIONED",
          moderatorId: session.user.id,
          moderatorNote: moderatorNote?.trim() || null,
          resolvedAt: new Date(),
        },
      });
      if (updated.count !== 1) throw new Error("REPORT_ALREADY_REVIEWED");
    });
  } catch (error) {
    if (error.message === "REPORT_ALREADY_REVIEWED") {
      return NextResponse.json({ error: "This report has already been reviewed" }, { status: 409 });
    }
    throw error;
  }

  await logActivity({
    actorId: session.user.id,
    targetId: report.targetId,
    actionType: `REPORT_${action}`,
    summary: `${action.replaceAll("_", " ").toLowerCase()} after reviewing a community report`,
    details: { reportId: report.id, targetType: report.targetType },
  });
  return NextResponse.json({ message: "Report reviewed", status: action === "DISMISS" ? "DISMISSED" : "ACTIONED" });
}
