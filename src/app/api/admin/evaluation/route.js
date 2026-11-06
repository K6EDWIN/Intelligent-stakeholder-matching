import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeContentScore } from "@/lib/recommendation";
import { buildConnectionsByUser, computeCollaborativeScore } from "@/lib/collaborative";
import { computeHybridWeights, computeHybridScore } from "@/lib/hybrid";
import { buildTrainingExamples, evaluateTemporalModel, evaluateTemporalRelevance, scoreCandidate, trainAcceptanceModel, trainRelevanceModel } from "@/lib/adaptive-recommender";
import { getAdaptivePredictions } from "@/lib/hosted-ml";
import { diversifyRankedCandidates } from "@/lib/profile-vectors";
import { getMlUserKey } from "@/lib/ml-sync-auth";

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

    const [profiles, acceptedMentorships, acceptedConnections, resolvedMentorships, resolvedConnections, relevanceFeedback, modelArtifacts] = await Promise.all([
      prisma.profile.findMany({
        where: { user: { isVerified: true, isSuspended: false, isDemo: false } },
        include: {
          user: { select: { id: true, role: true } },
          skills: { include: { skill: true } },
          interests: { include: { interest: true } },
        },
      }),
      prisma.mentorshipRequest.findMany({
        where: { status: "ACCEPTED", sender: { is: { isDemo: false } }, receiver: { is: { isDemo: false } } },
        select: { senderId: true, receiverId: true },
      }),
      prisma.connectionRequest.findMany({
        where: { status: "ACCEPTED", sender: { is: { isDemo: false } }, receiver: { is: { isDemo: false } } },
        select: { senderId: true, receiverId: true },
      }),
      prisma.mentorshipRequest.findMany({
        where: { status: { in: ["ACCEPTED", "DECLINED"] }, sender: { is: { isDemo: false } }, receiver: { is: { isDemo: false } } },
        select: { status: true, modelFeatures: true, createdAt: true },
      }),
      prisma.connectionRequest.findMany({
        where: { status: { in: ["ACCEPTED", "DECLINED"] }, sender: { is: { isDemo: false } }, receiver: { is: { isDemo: false } } },
        select: { status: true, modelFeatures: true, createdAt: true },
      }),
      prisma.feedback.findMany({
        where: {
          recommendationId: { not: null },
          user: { isDemo: false },
          recommendation: { is: { owner: { isDemo: false }, matchedUser: { isDemo: false } } },
        },
        select: { rating: true, modelFeatures: true, createdAt: true },
      }),
      prisma.mLModelArtifact.findMany({
        where: { OR: [{ active: true }, { type: "NCF" }] },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ]);

    const totalInteractions = acceptedMentorships.length + acceptedConnections.length;
    const connectionsByUser = buildConnectionsByUser([
      ...acceptedMentorships,
      ...acceptedConnections,
    ]);
    const trainingExamples = buildTrainingExamples([
      ...resolvedMentorships,
      ...resolvedConnections,
    ]);
    const model = trainAcceptanceModel(trainingExamples);
    const relevanceModel = trainRelevanceModel(relevanceFeedback);
    const latestNcfArtifact = modelArtifacts.find((artifact) => artifact.type === "NCF") || null;
    const temporalEvaluation = evaluateTemporalModel([
      ...resolvedMentorships,
      ...resolvedConnections,
    ]);
    const relevanceEvaluation = evaluateTemporalRelevance(relevanceFeedback);
    const hybridWeights = computeHybridWeights(totalInteractions);
    const modelState = await getAdaptivePredictions({
      examples: trainingExamples,
      relevanceExamples: relevanceFeedback
        .filter((row) => row.modelFeatures && (row.rating >= 4 || row.rating <= 2))
        .map((row) => ({ features: row.modelFeatures, label: row.rating >= 4 ? 1 : 0 })),
      candidates: [],
      localModel: model,
      relevanceModel,
      artifacts: modelArtifacts,
    });

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
          const adaptive = scoreCandidate({
            owner: targetProfile,
            candidate: cand,
            ownerAttrs: targetAttrs,
            candidateAttrs: candAttrs,
            connectionsByUser,
            model,
            totalAcceptedInteractions: totalInteractions,
          });

          const sharedSkillNames = cand.skills
            .filter((s) => targetSkillIds.has(s.skillId))
            .map((s) => skillMap[s.skillId] || "Technical Skill");

          return {
            id: cand.user.id,
            name: cand.fullName || "Stakeholder",
            department: cand.department || "Operations",
            role: cand.user.role,
            contentScore: +(cbf * 100).toFixed(1),
            semanticScore: +(adaptive.semanticScore * 100).toFixed(1),
            collaborativeScore: +(cf * 100).toFixed(1),
            mlAcceptanceProbability: adaptive.mlAcceptanceProbability,
            baselineScore: adaptive.baselineScore,
            modelFeatures: adaptive.modelFeatures,
            matchScore: adaptive.matchScore,
            sharedSkills: sharedSkillNames,
          };
        });

      const hostedPredictions = await getAdaptivePredictions({
        examples: trainingExamples,
        relevanceExamples: relevanceFeedback
          .filter((row) => row.modelFeatures && (row.rating >= 4 || row.rating <= 2))
          .map((row) => ({ features: row.modelFeatures, label: row.rating >= 4 ? 1 : 0 })),
        candidates: simResults.map((item) => ({ features: item.modelFeatures })),
        ncfCandidates: simResults.map((item) => ({
          senderKey: getMlUserKey(targetProfile.user.id),
          recipientKey: getMlUserKey(item.id),
        })),
        localModel: model,
        relevanceModel,
        artifacts: modelArtifacts,
      });
      const simulationNcfModel = hostedPredictions.ncfModel || { active: false, sampleCount: 0, confidence: 0 };
      const simulationNcfPredictions = hostedPredictions.ncfPredictions || simResults.map(() => null);
      const simulationRelevanceModel = hostedPredictions.relevanceModel || relevanceModel;
      const simulationRelevancePredictions = hostedPredictions.relevancePredictions || simResults.map(() => null);
      simResults.forEach((item, index) => {
        item.mlAcceptanceProbability = hostedPredictions.predictions[index];
        const acceptanceScore = item.mlAcceptanceProbability === null
          ? item.baselineScore
          : item.baselineScore * (1 - hostedPredictions.model.confidence) +
            item.mlAcceptanceProbability * hostedPredictions.model.confidence;
        item.ncfProbability = simulationNcfPredictions[index];
        item.ncfInfluence = item.ncfProbability === null
          ? 0
          : Math.min(0.2, simulationNcfModel.confidence * 0.2);
        const ncfAdjustedScore = item.ncfProbability === null
          ? acceptanceScore
          : acceptanceScore * (1 - item.ncfInfluence) + item.ncfProbability * item.ncfInfluence;
        item.relevanceProbability = simulationRelevancePredictions[index];
        const relevanceInfluence = item.relevanceProbability === null ? 0 : simulationRelevanceModel.confidence * 0.35;
        item.matchScore = item.relevanceProbability === null
          ? ncfAdjustedScore
          : ncfAdjustedScore * (1 - relevanceInfluence) + item.relevanceProbability * relevanceInfluence;
      });
      const rankedSimResults = diversifyRankedCandidates(simResults.sort((a, b) => b.matchScore - a.matchScore), 5);

      return NextResponse.json({
        simulation: {
          targetUser: {
            id: targetProfile.user.id,
            name: targetProfile.fullName || "Stakeholder",
            department: targetProfile.department || "Operations",
            role: targetProfile.user.role,
          },
          candidates: rankedSimResults.map(({ baselineScore, modelFeatures, ...item }) => ({
            ...item,
            mlAcceptanceProbability: item.mlAcceptanceProbability === null
              ? null
              : +(item.mlAcceptanceProbability * 100).toFixed(1),
            matchScore: +(item.matchScore * 100).toFixed(1),
            relevanceProbability: item.relevanceProbability === null ? null : +(item.relevanceProbability * 100).toFixed(1),
            ncfAcceptanceProbability: item.ncfProbability === null ? null : +(item.ncfProbability * 100).toFixed(1),
            ncfInfluence: +(item.ncfInfluence * 100).toFixed(1),
            diversityAdjustment: +(item.diversityAdjustment * 100).toFixed(1),
          })),
          model: {
            active: hostedPredictions.model.active,
            trainingExamples: hostedPredictions.model.sampleCount,
            acceptedExamples: hostedPredictions.model.acceptedCount,
            declinedExamples: hostedPredictions.model.declinedCount,
            confidence: Math.round(hostedPredictions.model.confidence * 100),
            featureWeights: hostedPredictions.model.weights,
            provider: hostedPredictions.provider,
            versions: {
              acceptance: hostedPredictions.model.version || null,
              relevance: simulationRelevanceModel.version || null,
            },
            trainedAt: hostedPredictions.model.createdAt || simulationRelevanceModel.createdAt || null,
            relevance: {
              active: simulationRelevanceModel.active,
              trainingExamples: simulationRelevanceModel.sampleCount,
              confidence: Math.round(simulationRelevanceModel.confidence * 100),
            },
            ncf: {
              active: simulationNcfModel.active,
              trainingExamples: simulationNcfModel.sampleCount,
              confidence: Math.round(simulationNcfModel.confidence * 100),
              version: simulationNcfModel.version || latestNcfArtifact?.version || null,
              evaluated: Boolean(latestNcfArtifact),
              latestEvaluationActive: latestNcfArtifact?.active ?? null,
              holdoutRocAuc: simulationNcfModel.metrics?.holdoutRocAuc ?? latestNcfArtifact?.metrics?.holdoutRocAuc ?? null,
            },
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
      adaptiveModel: {
        active: modelState.model.active,
        provider: modelState.provider,
        trainingExamples: modelState.model.sampleCount,
        acceptedExamples: modelState.model.acceptedCount,
        declinedExamples: modelState.model.declinedCount,
        confidence: Math.round(modelState.model.confidence * 100),
        featureWeights: modelState.model.weights,
        version: modelState.model.version || modelState.relevanceModel.version || null,
        trainedAt: modelState.model.createdAt || modelState.relevanceModel.createdAt || null,
        relevance: {
          active: modelState.relevanceModel.active,
          trainingExamples: modelState.relevanceModel.sampleCount,
          positiveExamples: modelState.relevanceModel.acceptedCount,
          negativeExamples: modelState.relevanceModel.declinedCount,
          confidence: Math.round(modelState.relevanceModel.confidence * 100),
        },
        ncf: {
          active: modelState.ncfModel.active,
          trainingExamples: modelState.ncfModel.active ? modelState.ncfModel.sampleCount : latestNcfArtifact?.sampleCount || 0,
          confidence: Math.round(modelState.ncfModel.confidence * 100),
          version: modelState.ncfModel.version || latestNcfArtifact?.version || null,
          evaluated: Boolean(latestNcfArtifact),
          latestEvaluationActive: latestNcfArtifact?.active ?? null,
          holdoutRocAuc: modelState.ncfModel.metrics?.holdoutRocAuc ?? latestNcfArtifact?.metrics?.holdoutRocAuc ?? null,
        },
      },
      temporalEvaluation,
      relevanceEvaluation,
      memberFeedback: {
        total: relevanceFeedback.length,
        useful: relevanceFeedback.filter((row) => row.rating >= 4).length,
        notUseful: relevanceFeedback.filter((row) => row.rating <= 2).length,
      },
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
