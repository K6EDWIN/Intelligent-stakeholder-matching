import { describe, it, expect } from "vitest";
import {
  buildConnectionsByUser,
  computeCollaborativeScore,
} from "@/lib/collaborative";

describe("Collaborative Filtering (collaborative.js)", () => {
  describe("buildConnectionsByUser()", () => {
    it("builds an undirected adjacency map from accepted requests", () => {
      const requests = [
        { senderId: "user-1", receiverId: "user-2" },
        { senderId: "user-2", receiverId: "user-3" },
      ];

      const graph = buildConnectionsByUser(requests);

      expect(graph.get("user-1").has("user-2")).toBe(true);
      expect(graph.get("user-2").has("user-1")).toBe(true);
      expect(graph.get("user-2").has("user-3")).toBe(true);
      expect(graph.get("user-3").has("user-2")).toBe(true);
      expect(graph.get("user-1").has("user-3")).toBe(false);
    });

    it("handles an empty interaction list cleanly", () => {
      const graph = buildConnectionsByUser([]);
      expect(graph.size).toBe(0);
    });
  });

  describe("computeCollaborativeScore()", () => {
    it("returns 0 when owner has no recorded connections", () => {
      const graph = new Map([
        ["user-2", new Set(["user-3", "user-4"])],
      ]);

      const score = computeCollaborativeScore(graph, "user-owner", "user-candidate");
      expect(score).toBe(0);
    });

    it("returns 0 when no other user shares any connection with the owner", () => {
      const graph = new Map([
        ["user-owner", new Set(["uA", "uB"])],
        ["user-other", new Set(["uC", "uD"])],
      ]);

      const score = computeCollaborativeScore(graph, "user-owner", "user-candidate");
      expect(score).toBe(0);
    });

    it("scores higher when similar peers are connected with the candidate", () => {
      // Owner connected to [u1, u2]
      // Peer 1 is identical connection pattern [u1, u2] -> similarity = 1.0. Connected to candidate!
      // Peer 2 has disjoint connections [u3] -> similarity = 0.
      const graph = new Map([
        ["user-owner", new Set(["u1", "u2"])],
        ["peer-1", new Set(["u1", "u2", "candidate"])],
        ["peer-2", new Set(["u3"])],
      ]);

      const score = computeCollaborativeScore(graph, "user-owner", "candidate");
      // Jaccard(owner, peer-1) = {u1, u2} / {u1, u2, candidate} = 2 / 3
      // Total similarity = 2/3
      // Weighted votes = 2/3 (since peer-1 is connected to candidate)
      // Score = (2/3) / (2/3) = 1.0
      expect(score).toBe(1.0);
    });

    it("returns 0 when similar peers are NOT connected with the candidate", () => {
      const graph = new Map([
        ["user-owner", new Set(["u1", "u2"])],
        ["peer-1", new Set(["u1", "u2", "other-person"])],
      ]);

      const score = computeCollaborativeScore(graph, "user-owner", "candidate");
      expect(score).toBe(0);
    });

    it("ignores the owner themselves during similarity voting", () => {
      const graph = new Map([
        ["user-owner", new Set(["candidate", "u1"])],
      ]);

      // Even if owner is already connected to candidate, score shouldn't be influenced by self-vote
      const score = computeCollaborativeScore(graph, "user-owner", "candidate");
      expect(score).toBe(0);
    });
  });
});
