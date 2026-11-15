import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/flight-reconnect/route";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";

vi.mock("next-auth/next", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/audit-log", () => ({ logActivity: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { flightReconnect: { findMany: vi.fn() } },
}));

describe("GET /api/flight-reconnect consent behavior", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns no peer matches for an opted-out flight instead of rejecting the request", async () => {
    getServerSession.mockResolvedValueOnce({ user: { id: "member-1" } });
    prisma.flightReconnect.findMany.mockResolvedValueOnce([{
      id: "flight-1",
      userId: "member-1",
      flightRoute: "v2|KQ 102|NBO|LHR",
      travelDate: new Date("2025-01-01T00:00:00.000Z"),
      consentToShare: false,
    }]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.myFlights).toHaveLength(1);
    expect(data.matches).toEqual([]);
    expect(prisma.flightReconnect.findMany).toHaveBeenCalledTimes(1);
  });
});
