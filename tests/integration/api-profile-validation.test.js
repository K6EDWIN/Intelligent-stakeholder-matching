import { beforeEach, describe, expect, it, vi } from "vitest";
import { PUT } from "@/app/api/profile/route";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";

vi.mock("next-auth/next", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/audit-log", () => ({ logActivity: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));

function profileRequest(body) {
  return new Request("http://localhost:3000/api/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PUT /api/profile validation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requires a full name", async () => {
    getServerSession.mockResolvedValueOnce({ user: { id: "member-1", role: "STAFF" } });
    const response = await PUT(profileRequest({ fullName: "" }));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("fullName is required");
    expect(prisma.profile.findUnique).not.toHaveBeenCalled();
  });

  it("rejects skill, interest, and topic selections that are not arrays of string identifiers", async () => {
    getServerSession.mockResolvedValueOnce({ user: { id: "member-1", role: "STAFF" } });
    const response = await PUT(profileRequest({ fullName: "Member", skillIds: ["skill-1", 42] }));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("Profile selections must be arrays of identifiers");
    expect(prisma.profile.findUnique).not.toHaveBeenCalled();
  });
});
