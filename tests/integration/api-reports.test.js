import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST as submitReport } from "@/app/api/reports/route";
import { PATCH as moderateReport } from "@/app/api/admin/reports/route";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";

vi.mock("next-auth/next", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/audit-log", () => ({ logActivity: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findFirst: vi.fn() },
    opportunity: { findFirst: vi.fn() },
    event: { findFirst: vi.fn() },
    report: { findFirst: vi.fn(), create: vi.fn(), findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));

function request(body, url = "http://localhost:3000/api/reports") {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("community reports and moderation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires authentication and validates a report before writing", async () => {
    getServerSession.mockResolvedValueOnce(null);
    const unauthorized = await submitReport(request({}));
    expect(unauthorized.status).toBe(401);

    getServerSession.mockResolvedValueOnce({ user: { id: "member-1" } });
    const invalid = await submitReport(request({ targetType: "USER", targetId: "member-2", reason: "made-up" }));
    expect(invalid.status).toBe(400);
    expect(prisma.report.create).not.toHaveBeenCalled();
  });

  it("creates an authenticated report and rejects a duplicate open report", async () => {
    getServerSession.mockResolvedValue({ user: { id: "member-1" } });
    prisma.user.findFirst.mockResolvedValue({ id: "member-2" });
    prisma.report.findFirst.mockResolvedValueOnce(null);
    prisma.report.create.mockResolvedValueOnce({ id: "report-1", status: "OPEN" });

    const created = await submitReport(request({
      targetType: "USER",
      targetId: "member-2",
      reason: "HARASSMENT",
      description: "Please review this profile.",
    }));
    expect(created.status).toBe(201);
    expect(prisma.report.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ reporterId: "member-1", targetId: "member-2", reason: "HARASSMENT" }),
    }));

    prisma.report.findFirst.mockResolvedValueOnce({ id: "report-1" });
    const duplicate = await submitReport(request({
      targetType: "USER",
      targetId: "member-2",
      reason: "HARASSMENT",
    }));
    expect(duplicate.status).toBe(409);
  });

  it("allows administrators to suspend a reported member and resolves the report transactionally", async () => {
    getServerSession.mockResolvedValueOnce({ user: { id: "admin-1", role: "ADMIN" } });
    prisma.report.findUnique.mockResolvedValueOnce({
      id: "report-1",
      targetId: "member-2",
      targetType: "USER",
      status: "OPEN",
    });
    prisma.user.findFirst.mockResolvedValueOnce({ id: "member-2" });
    const tx = {
      user: { update: vi.fn() },
      opportunity: { update: vi.fn() },
      event: { update: vi.fn() },
      report: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
    };
    prisma.$transaction.mockImplementationOnce((callback) => callback(tx));

    const response = await moderateReport(new Request("http://localhost:3000/api/admin/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId: "report-1", action: "SUSPEND_USER" }),
    }));

    expect(response.status).toBe(200);
    expect(tx.user.update).toHaveBeenCalledWith({ where: { id: "member-2" }, data: { isSuspended: true } });
    expect(tx.report.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "report-1", status: "OPEN" },
      data: expect.objectContaining({ status: "ACTIONED", moderatorId: "admin-1" }),
    }));
  });

  it("does not allow a member to moderate a report", async () => {
    getServerSession.mockResolvedValueOnce({ user: { id: "member-1", role: "STAFF" } });
    const response = await moderateReport(new Request("http://localhost:3000/api/admin/reports", { method: "PATCH" }));
    expect(response.status).toBe(403);
    expect(prisma.report.findUnique).not.toHaveBeenCalled();
  });
});
