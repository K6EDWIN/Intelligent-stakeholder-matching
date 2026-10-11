import { describe, it, expect } from "vitest";
import { computeHybridWeights, computeHybridScore } from "@/lib/hybrid";

describe("Hybrid Scoring Model (hybrid.js)", () => {
  describe("computeHybridWeights()", () => {
    it("weights content-based similarity heavily (alpha = 0.9, beta = 0.1) under cold start (0 interactions)", () => {
      const weights = computeHybridWeights(0);
      expect(weights.alpha).toBeCloseTo(0.9);
      expect(weights.beta).toBeCloseTo(0.1);
      expect(weights.alpha + weights.beta).toBeCloseTo(1.0);
    });

    it("gradually shifts weight toward collaborative filtering as interactions increase", () => {
      // At 25 interactions (halfway to saturation point of 50):
      // progress = 25 / 50 = 0.5
      // alpha = 0.9 - 0.5 * (0.9 - 0.5) = 0.9 - 0.2 = 0.7
      // beta = 0.3
      const weights = computeHybridWeights(25);
      expect(weights.alpha).toBeCloseTo(0.7);
      expect(weights.beta).toBeCloseTo(0.3);
      expect(weights.alpha + weights.beta).toBeCloseTo(1.0);
    });

    it("caps collaborative weight at saturation (alpha = 0.5, beta = 0.5 at >= 50 interactions)", () => {
      const atSaturation = computeHybridWeights(50);
      expect(atSaturation.alpha).toBeCloseTo(0.5);
      expect(atSaturation.beta).toBeCloseTo(0.5);

      const beyondSaturation = computeHybridWeights(500);
      expect(beyondSaturation.alpha).toBeCloseTo(0.5);
      expect(beyondSaturation.beta).toBeCloseTo(0.5);
    });

    it("safely handles negative or invalid interaction counts", () => {
      const weights = computeHybridWeights(-10);
      expect(weights.alpha).toBeCloseTo(0.9);
      expect(weights.beta).toBeCloseTo(0.1);
    });

    it("maintains the invariant alpha + beta = 1 for any interaction count", () => {
      const testCounts = [0, 1, 5, 10, 25, 49, 50, 100, 1000];
      for (const count of testCounts) {
        const { alpha, beta } = computeHybridWeights(count);
        expect(alpha + beta).toBeCloseTo(1.0);
      }
    });
  });

  describe("computeHybridScore()", () => {
    it("combines content and collaborative scores according to assigned weights", () => {
      const weights = { alpha: 0.8, beta: 0.2 };
      const contentScore = 0.75;
      const collaborativeScore = 0.5;

      // 0.8 * 0.75 + 0.2 * 0.5 = 0.6 + 0.1 = 0.7
      const score = computeHybridScore(contentScore, collaborativeScore, weights);
      expect(score).toBeCloseTo(0.7);
    });

    it("returns pure content score when beta is 0", () => {
      const weights = { alpha: 1.0, beta: 0.0 };
      const score = computeHybridScore(0.85, 0.2, weights);
      expect(score).toBeCloseTo(0.85);
    });

    it("returns 0 when both input scores are 0", () => {
      const weights = { alpha: 0.7, beta: 0.3 };
      const score = computeHybridScore(0, 0, weights);
      expect(score).toBe(0);
    });
  });
});
