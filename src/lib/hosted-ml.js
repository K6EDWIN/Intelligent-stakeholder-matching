function localPredictionResult(candidates, localModel, provider) {
  return {
    provider,
    model: {
      active: localModel.active,
      sampleCount: localModel.sampleCount,
      acceptedCount: localModel.acceptedCount,
      declinedCount: localModel.declinedCount,
      confidence: localModel.confidence,
      weights: localModel.weights || null,
    },
    predictions: candidates.map(({ features }) =>
      localModel.active ? localModel.predict(features) : null
    ),
  };
}

/** Send numeric-only training examples and candidate features to the HF Space. */
export async function getAdaptivePredictions({ examples, candidates, localModel }) {
  const serviceUrl = (
    process.env.ML_SERVICE_URL || process.env.HF_ML_SERVICE_URL
  )?.replace(/\/$/, "");
  const serviceToken = process.env.ML_SERVICE_TOKEN || process.env.HF_ML_SERVICE_TOKEN;

  if (!serviceUrl || !serviceToken) {
    return localPredictionResult(
      candidates,
      localModel,
      serviceUrl ? "LOCAL (HOSTED SERVICE TOKEN MISSING)" : "LOCAL"
    );
  }

  try {
    const response = await fetch(`${serviceUrl}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceToken}`,
      },
      body: JSON.stringify({
        training_examples: examples,
        candidates,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Hosted recommender returned ${response.status}`);
    }

    const result = await response.json();
    if (
      !Array.isArray(result.predictions) ||
      result.predictions.length !== candidates.length
    ) {
      throw new Error("Hosted recommender returned an invalid prediction list");
    }

    return {
      provider: "HOSTED_API",
      model: {
        active: Boolean(result.active),
        sampleCount: Number(result.trainingExamples) || 0,
        acceptedCount: Number(result.acceptedExamples) || 0,
        declinedCount: Number(result.declinedExamples) || 0,
        confidence: Math.max(0, Math.min(1, Number(result.confidence) || 0)),
        weights: result.featureWeights || null,
      },
      predictions: result.predictions.map((value) =>
        value == null ? null : Math.max(0, Math.min(1, Number(value)))
      ),
    };
  } catch (error) {
    console.warn("Hosted recommender unavailable; using the local model:", error.message);
    return localPredictionResult(candidates, localModel, "LOCAL_FALLBACK");
  }
}
