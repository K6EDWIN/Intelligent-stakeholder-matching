import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/mentorship-requests/route";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";

vi.mock("next-auth/next", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    mentorshipRequest: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    profile: {
      findUnique: vi.fn(),
    },
    connectionRequest: {
      findMany: vi.fn(),
    },
  },
}));

describe("/api/mentorship-requests API Endpoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prisma.mentorshipRequest.findMany.mockResolvedValue([]);
    prisma.connectionRequest.findMany.mockResolvedValue([]);
  });

  describe("GET", () => {
    it("returns 401 when unauthenticated", async () => {
      getServerSession.mockResolvedValueOnce(null);

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe("Not authenticated");
    });

    it("returns sent and received mentorship requests for logged in user", async () => {
      getServerSession.mockResolvedValueOnce({
        user: { id: "user-mentor" },
      });

      const mockSent = [{ id: "mreq-1", receiverId: "user-other", status: "PENDING" }];
      const mockReceived = [{ id: "mreq-2", senderId: "user-mentee", status: "ACCEPTED" }];

      prisma.mentorshipRequest.findMany
        .mockResolvedValueOnce(mockSent)
        .mockResolvedValueOnce(mockReceived);

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.sent).toEqual(mockSent);
      expect(data.received).toEqual(mockReceived);
    });
  });

  describe("POST", () => {
    it("returns 401 when unauthenticated", async () => {
      getServerSession.mockResolvedValueOnce(null);

      const req = new Request("http://localhost:3000/api/mentorship-requests", {
        method: "POST",
        body: JSON.stringify({ receiverId: "user-mentor", message: "Mentorship inquiry" }),
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe("Not authenticated");
    });

    it("returns 400 when receiverId is missing", async () => {
      getServerSession.mockResolvedValueOnce({
        user: { id: "user-mentee" },
      });

      const req = new Request("http://localhost:3000/api/mentorship-requests", {
        method: "POST",
        body: JSON.stringify({ message: "Hello" }),
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe("receiverId is required");
    });

    it("returns 400 when attempting to send request to oneself", async () => {
      getServerSession.mockResolvedValueOnce({
        user: { id: "user-same" },
      });

      const req = new Request("http://localhost:3000/api/mentorship-requests", {
        method: "POST",
        body: JSON.stringify({ receiverId: "user-same" }),
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe("You can't send a request to yourself");
    });

    it("returns 404 if recipient user does not exist", async () => {
      getServerSession.mockResolvedValueOnce({
        user: { id: "user-mentee" },
      });
      prisma.user.findUnique.mockResolvedValueOnce(null);

      const req = new Request("http://localhost:3000/api/mentorship-requests", {
        method: "POST",
        body: JSON.stringify({ receiverId: "ghost-user" }),
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe("Recipient not found");
    });

    it("returns 409 if a pending request already exists", async () => {
      getServerSession.mockResolvedValueOnce({
        user: { id: "user-mentee" },
      });
      prisma.user.findUnique.mockResolvedValueOnce({ id: "user-mentor" });
      prisma.mentorshipRequest.findFirst.mockResolvedValueOnce({
        id: "mreq-existing",
        status: "PENDING",
      });

      const req = new Request("http://localhost:3000/api/mentorship-requests", {
        method: "POST",
        body: JSON.stringify({ receiverId: "user-mentor" }),
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(409);
      expect(data.error).toBe("You already have a pending mentorship request to this person");
    });

    it("creates and returns mentorship request with status 201 on success", async () => {
      getServerSession.mockResolvedValueOnce({
        user: { id: "user-mentee" },
      });
      prisma.user.findUnique.mockResolvedValueOnce({ id: "user-mentor" });
      prisma.mentorshipRequest.findFirst.mockResolvedValueOnce(null);
      const createdRecord = {
        id: "mreq-new-123",
        senderId: "user-mentee",
        receiverId: "user-mentor",
        message: "I would like to learn about Boeing 787 maintenance.",
        status: "PENDING",
      };
      prisma.mentorshipRequest.create.mockResolvedValueOnce(createdRecord);

      const req = new Request("http://localhost:3000/api/mentorship-requests", {
        method: "POST",
        body: JSON.stringify({
          receiverId: "user-mentor",
          message: "I would like to learn about Boeing 787 maintenance.",
        }),
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.mentorshipRequest).toEqual(createdRecord);
    });
  });
});
