import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthorizedMlSyncRequest } from "@/lib/ml-sync-auth";

const FEATURE_NAMES = ["skillOverlap", "interestOverlap", "sameDepartment", "mentorshipRoleFit", "sharedNetwork", "isMentorshipRequest", "semanticProfileOverlap"];
const MODEL_TYPES = new Set(["ACCEPTANCE", "RELEVANCE", "NCF"]);
const isFiniteNumber = (value) => typeof value === "number" && Number.isFinite(value);
const NCF_FEATURE_NAMES = ["senderKey", "recipientKey", "requestTypeOneHot"];

function validateNcfArtifact(artifact) {
  if (JSON.stringify(artifact.featureNames) !== JSON.stringify(NCF_FEATURE_NAMES)) throw new Error("NCF feature schema is invalid");
  const payload = artifact.weights;
  if (!payload?.userEmbeddings || !payload?.layer1 || !payload?.layer2) throw new Error("NCF embedding or network weights are missing");
  const embeddings = Object.entries(payload.userEmbeddings);
  if (embeddings.length < 12 || embeddings.length > 12000 || embeddings.some(([key, vector]) => !/^[a-f0-9]{64}$/.test(key) || !Array.isArray(vector) || vector.length !== 8 || vector.some((value) => !isFiniteNumber(value)))) throw new Error("NCF user embeddings are invalid");
  if (!Array.isArray(payload.layer1.weights) || payload.layer1.weights.length !== 16 || payload.layer1.weights.some((row) => !Array.isArray(row) || row.length !== 18 || row.some((value) => !isFiniteNumber(value))) || !Array.isArray(payload.layer1.bias) || payload.layer1.bias.length !== 16 || payload.layer1.bias.some((value) => !isFiniteNumber(value))) throw new Error("NCF hidden layer weights are invalid");
  if (!Array.isArray(payload.layer2.weights) || payload.layer2.weights.length !== 1 || payload.layer2.weights[0].length !== 16 || payload.layer2.weights[0].some((value) => !isFiniteNumber(value)) || !Array.isArray(payload.layer2.bias) || payload.layer2.bias.length !== 1 || !isFiniteNumber(payload.layer2.bias[0])) throw new Error("NCF output layer weights are invalid");
  const qualityPassed = artifact.sampleCount >= 80 && isFiniteNumber(artifact.metrics?.holdoutRocAuc) && artifact.metrics.holdoutRocAuc >= 0.52 && isFiniteNumber(artifact.metrics?.holdoutCoverage) && artifact.metrics.holdoutCoverage >= 0.4;
  if (artifact.active !== false && !qualityPassed) throw new Error("NCF must beat the minimum holdout quality and user-coverage checks before it can be activated");
  return qualityPassed;
}

export async function POST(request) {
  if (!isAuthorizedMlSyncRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!Array.isArray(body.artifacts) || body.artifacts.length < 1 || body.artifacts.length > 3) {
      return NextResponse.json({ error: "Provide one to three trained model artifacts" }, { status: 400 });
    }
    const validated = body.artifacts.map((artifact) => {
      if (!MODEL_TYPES.has(artifact.type) || typeof artifact.version !== "string" || artifact.version.length > 80) throw new Error("Invalid model type or version");
      const isNcf = artifact.type === "NCF";
      if (!isNcf && JSON.stringify(artifact.featureNames) !== JSON.stringify(FEATURE_NAMES)) throw new Error("Feature names do not match this app version");
      const ncfQualityPassed = isNcf ? validateNcfArtifact(artifact) : true;
      if (!isNcf && (!artifact.weights || FEATURE_NAMES.some((name) => !isFiniteNumber(artifact.weights[name])))) throw new Error("Model weights are missing or invalid");
      if (!isFiniteNumber(artifact.bias) || !Number.isInteger(artifact.sampleCount) || artifact.sampleCount < 1 || !Number.isInteger(artifact.positiveCount) || !Number.isInteger(artifact.negativeCount) || artifact.positiveCount + artifact.negativeCount !== artifact.sampleCount) throw new Error("Model counts or bias are invalid");
      if (!isFiniteNumber(artifact.confidence) || artifact.confidence < 0 || artifact.confidence > 1) throw new Error("Model confidence must be between 0 and 1");
      return {
        type: artifact.type,
        version: artifact.version,
        featureNames: isNcf ? NCF_FEATURE_NAMES : FEATURE_NAMES,
        weights: isNcf ? artifact.weights : Object.fromEntries(FEATURE_NAMES.map((name) => [name, artifact.weights[name]])),
        bias: artifact.bias,
        sampleCount: artifact.sampleCount,
        positiveCount: artifact.positiveCount,
        negativeCount: artifact.negativeCount,
        confidence: artifact.confidence,
        active: isNcf ? artifact.active !== false && ncfQualityPassed : true,
        metrics: artifact.metrics && typeof artifact.metrics === "object" ? artifact.metrics : undefined,
      };
    });
    if (new Set(validated.map((artifact) => artifact.type)).size !== validated.length) {
      return NextResponse.json({ error: "Only one artifact per model type can be uploaded at a time" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      for (const artifact of validated) {
        if (artifact.active) {
          await tx.mLModelArtifact.updateMany({ where: { type: artifact.type, active: true }, data: { active: false } });
        }
        await tx.mLModelArtifact.create({ data: artifact });
      }
    });
    return NextResponse.json({ published: validated.map(({ type, version, sampleCount, active }) => ({ type, version, sampleCount, active })) });
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    if (error.message?.includes("Invalid") || error.message?.includes("Feature") || error.message?.includes("Model") || error.message?.includes("NCF") || error.message?.includes("Only one")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("ML artifact publish failed:", error);
    return NextResponse.json({ error: "Could not publish model artifacts" }, { status: 500 });
  }
}
