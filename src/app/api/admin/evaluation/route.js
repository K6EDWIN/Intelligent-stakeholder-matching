import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeContentScore } from "@/lib/recommendation";
import { buildConnectionsByUser, computeCollaborativeScore } from "@/lib/collaborative";
import { computeHybridWeights, computeHybridScore } from "@/lib/hybrid";

// Helper: Discounted Cumulative Gain
function computeDCG(relevanceList) {
  return relevanceList.reduce((acc, rel, idx) => {
    return acc + (Math.pow(2, rel) - 1) / Math.log2(idx + 2);
  }, 0);
}

// GET /api/admin/evaluation
// Computes Precision@K, Recall@K, NDCG@K, and MRR for CBF, CF, and Hybrid
// Also supports ?simulateUserId=<id> for live recommendation engine inspection
export async function GET(req) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Allow admins or test evaluation
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const startTime = Date.now();

  try {
    const url = new URL(req.url);
    const simulateUserId = url.searchParams.get("simulateUserId");

    const [profiles, acceptedMentorships, acceptedConnections] = await Promise.all([
      prisma.profile.findMany({
        where: { user: { isVerified: true, isSuspended: false } },
        include: {
          user: { select: { id: true, role: true } },
          skills: true,
          interests: true,
        },
      }),
      prisma.mentorshipRequest.findMany({
        where: { status: "ACCEPTED" },
        select: { senderId: true, receiverId: true },
      }),
      prisma.connectionRequest.findMany({
        where: { status: "ACCEPTED" },
        select: { senderId: true, receiverId: true },
      }),
    ]);

    const totalInteractions = acceptedMentorships.length + acceptedConnections.length;
    const connectionsByUser = buildConnectionsByUser([
      ...acceptedMentorships,
      ...acceptedConnections,
    ]);
    const hybridWeights = computeHybridWeights(totalInteractions);

    // Live recommendation simulation for a selected stakeholder
    if (simulateUserId) {
      const targetProfile = profiles.find((p) => p.user.id === simulateUserId);
      if (!targetProfile) {
        return NextResponse.json({ error: "Target stakeholder not found" }, { status: 404 });
      }

      const targetAttrs = {
        skillIds: targetProfile.skills.map((s) => s.skillId),
        interestIds: targetProfile.interests.map((i) => i.interestId),
      };

      const skillLookup = await prisma.skill.findMany({ select: { id: true, name: true } });
      const skillMap = Object.fromEntries(skillLookup.map((s) => [s.id, s.name]));
      const targetSkillIds = new Set(targetAttrs.skillIds);

      const simResults = profiles
        .filter((p) => p.user.id !== simulateUserId)
        .map((cand) => {
          const candAttrs = {
            skillIds: cand.skills.map((s) => s.skillId),
            interestIds: cand.interests.map((i) => i.interestId),
          };

          const cbf = computeContentScore(targetAttrs, candAttrs);
          const cf = computeCollaborativeScore(connectionsByUser, simulateUserId, cand.user.id);
          const hybrid = computeHybridScore(cbf, cf, hybridWeights);

          const sharedSkillNames = cand.skills
            .filter((s) => targetSkillIds.has(s.skillId))
            .map((s) => skillMap[s.skillId] || "Technical Skill");

          return {
            id: cand.user.id,
            name: cand.fullName || "Stakeholder",
            department: cand.department || "Operations",
            role: cand.user.role,
            contentScore: +(cbf * 100).toFixed(1),
            collaborativeScore: +(cf * 100).toFixed(1),
            hybridScore: +(hybrid * 100).toFixed(1),
            sharedSkills: sharedSkillNames,
          };
        })
        .sort((a, b) => b.hybridScore - a.hybridScore)
        .slice(0, 5);

      return NextResponse.json({
        simulation: {
          targetUser: {
            id: targetProfile.user.id,
            name: targetProfile.fullName || "Stakeholder",
            department: targetProfile.department || "Operations",
            role: targetProfile.user.role,
          },
          candidates: simResults,
          weights: {
            alpha: Math.round(hybridWeights.alpha * 100),
            beta: Math.round(hybridWeights.beta * 100),
          },
          latencyMs: Date.now() - startTime,
        },
      });
    }

    // Run benchmark across users with at least 2 candidates
    if (profiles.length < 3) {
      return NextResponse.json({
        message: "Not enough profiles to run benchmark",
        benchmark: null,
      });
    }

    let cbfPrec5 = 0, cfPrec5 = 0, hybridPrec5 = 0;
    let cbfRec5 = 0, cfRec5 = 0, hybridRec5 = 0;
    let cbfNdcg10 = 0, cfNdcg10 = 0, hybridNdcg10 = 0;
    let cbfMrr = 0, cfMrr = 0, hybridMrr = 0;
    let evaluatedUsersCount = 0;

    for (const userProfile of profiles) {
      const userId = userProfile.user.id;
      const candidates = profiles.filter((p) => p.user.id !== userId);

      const userSkillIds = new Set(userProfile.skills.map((s) => s.skillId));

      // Ground truth relevant set: shared skills >= 2 OR connected
      const relevantCandidateIds = new Set(
        candidates
          .filter((c) => {
            const sharedCount = c.skills.filter((s) => userSkillIds.has(s.skillId)).length;
            const isConnected = connectionsByUser.get(userId)?.has(c.user.id) || false;
            return sharedCount >= 2 || isConnected;
          })
          .map((c) => c.user.id)
      );

      if (relevantCandidateIds.size === 0) continue;

      evaluatedUsersCount++;
      const totalRelevant = relevantCandidateIds.size;

      // Score all candidates
      const scoredCandidates = candidates.map((cand) => {
        const ownerAttrs = {
          skillIds: userProfile.skills.map((s) => s.skillId),
          interestIds: userProfile.interests.map((i) => i.interestId),
        };
        const candAttrs = {
          skillIds: cand.skills.map((s) => s.skillId),
          interestIds: cand.interests.map((i) => i.interestId),
        };

        const cbf = computeContentScore(ownerAttrs, candAttrs);
        const cf = computeCollaborativeScore(connectionsByUser, userId, cand.user.id);
        const hybrid = computeHybridScore(cbf, cf, hybridWeights);

        return {
          id: cand.user.id,
          cbf,
          cf,
          hybrid,
          isRelevant: relevantCandidateIds.has(cand.user.id) ? 1 : 0,
        };
      });

      // Rank by CBF
      const rankCbf = [...scoredCandidates].sort((a, b) => b.cbf - a.cbf);
      // Rank by CF
      const rankCf = [...scoredCandidates].sort((a, b) => b.cf - a.cf);
      // Rank by Hybrid
      const rankHybrid = [...scoredCandidates].sort((a, b) => b.hybrid - a.hybrid);

      // Top 5 metrics
      const top5CbfRel = rankCbf.slice(0, 5).filter((x) => x.isRelevant).length;
      const top5CfRel = rankCf.slice(0, 5).filter((x) => x.isRelevant).length;
      const top5HybridRel = rankHybrid.slice(0, 5).filter((x) => x.isRelevant).length;

      const precisionCutoff = Math.min(5, candidates.length);
      cbfPrec5 += top5CbfRel / precisionCutoff;
      cfPrec5 += top5CfRel / precisionCutoff;
      hybridPrec5 += top5HybridRel / precisionCutoff;

      cbfRec5 += top5CbfRel / totalRelevant;
      cfRec5 += top5CfRel / totalRelevant;
      hybridRec5 += top5HybridRel / totalRelevant;

      // NDCG@10
      const idealRelevance = Array(totalRelevant).fill(1).concat(Array(Math.max(0, 10 - totalRelevant)).fill(0)).slice(0, 10);
      const idcg = computeDCG(idealRelevance) || 1;

      cbfNdcg10 += computeDCG(rankCbf.slice(0, 10).map((x) => x.isRelevant)) / idcg;
      cfNdcg10 += computeDCG(rankCf.slice(0, 10).map((x) => x.isRelevant)) / idcg;
      hybridNdcg10 += computeDCG(rankHybrid.slice(0, 10).map((x) => x.isRelevant)) / idcg;

      // MRR
      const cbfFirstRelIdx = rankCbf.findIndex((x) => x.isRelevant);
      if (cbfFirstRelIdx !== -1) cbfMrr += 1 / (cbfFirstRelIdx + 1);

      const cfFirstRelIdx = rankCf.findIndex((x) => x.isRelevant);
      if (cfFirstRelIdx !== -1) cfMrr += 1 / (cfFirstRelIdx + 1);

      const hybridFirstRelIdx = rankHybrid.findIndex((x) => x.isRelevant);
      if (hybridFirstRelIdx !== -1) hybridMrr += 1 / (hybridFirstRelIdx + 1);
    }

    const n = Math.max(evaluatedUsersCount, 1);

    const benchmark = {
      evaluatedUsers: evaluatedUsersCount,
      totalStakeholders: profiles.length,
      totalInteractions,
      weights: {
        alpha: Math.round(hybridWeights.alpha * 100),
        beta: Math.round(hybridWeights.beta * 100),
      },
      latencyMs: Date.now() - startTime,
      upliftPercent: +(
        ((hybridNdcg10 - Math.max(cbfNdcg10, cfNdcg10, 0.001)) /
          Math.max(cbfNdcg10, cfNdcg10, 0.001)) *
        100
      ).toFixed(1),
      models: [
        {
          name: "Content-Based (CBF)",
          precisionAt5: +(cbfPrec5 / n).toFixed(3),
          recallAt5: +(cbfRec5 / n).toFixed(3),
          ndcgAt10: +(cbfNdcg10 / n).toFixed(3),
          mrr: +(cbfMrr / n).toFixed(3),
        },
        {
          name: "Collaborative (CF)",
          precisionAt5: +(cfPrec5 / n).toFixed(3),
          recallAt5: +(cfRec5 / n).toFixed(3),
          ndcgAt10: +(cfNdcg10 / n).toFixed(3),
          mrr: +(cfMrr / n).toFixed(3),
        },
        {
          name: "Hybrid (CBF + CF)",
          precisionAt5: +(hybridPrec5 / n).toFixed(3),
          recallAt5: +(hybridRec5 / n).toFixed(3),
          ndcgAt10: +(hybridNdcg10 / n).toFixed(3),
          mrr: +(hybridMrr / n).toFixed(3),
        },
      ],
    };

    const bestNdcg = Math.max(...benchmark.models.map((model) => model.ndcgAt10));
    benchmark.models = benchmark.models.map((model) => ({
      ...model,
      isBest: model.ndcgAt10 === bestNdcg,
    }));

    return NextResponse.json({ benchmark });
  } catch (err) {
    return NextResponse.json(
      { error: "Evaluation calculation error: " + err.message },
      { status: 500 }
    );
  }
}
