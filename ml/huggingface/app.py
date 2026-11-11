import hmac
import math
import os
from typing import Literal

from fastapi import Depends, FastAPI, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field


FEATURE_NAMES = [
    "skillOverlap",
    "interestOverlap",
    "sameDepartment",
    "mentorshipRoleFit",
    "sharedNetwork",
    "isMentorshipRequest",
    "semanticProfileOverlap",
    "availabilityDayOverlap",
    "availabilityTimeOverlap",
    "availabilityFrequencyFit",
    "availabilityPairKnown",
]
MIN_TRAINING_ROWS = 12
MIN_PER_CLASS = 4
FULL_INFLUENCE_ROWS = 50
bearer = HTTPBearer(auto_error=False)

app = FastAPI(
    title="PrideConnect Adaptive Recommender",
    description=(
        "Fits logistic-regression models from resolved request outcomes and "
        "explicit match ratings, then scores numeric candidate features. It receives "
        "numeric features only; profile text and member identities stay in the app."
    ),
    version="2.0.0",
)


class TrainingExample(BaseModel):
    features: dict[str, float]
    label: Literal[0, 1]


class Candidate(BaseModel):
    features: dict[str, float]


class PredictRequest(BaseModel):
    training_examples: list[TrainingExample] = Field(max_length=50000)
    relevance_examples: list[TrainingExample] = Field(default_factory=list, max_length=50000)
    candidates: list[Candidate] = Field(max_length=1000)


def sigmoid(value: float) -> float:
    if value < -30:
        return 0.0
    if value > 30:
        return 1.0
    return 1.0 / (1.0 + math.exp(-value))


def authorize(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)):
    expected = os.getenv("ML_SERVICE_TOKEN", "")
    if not expected:
        raise HTTPException(status_code=503, detail="ML_SERVICE_TOKEN is not configured")
    provided = credentials.credentials if credentials else ""
    if not hmac.compare_digest(provided, expected):
        raise HTTPException(status_code=401, detail="Invalid service token")


def fit(examples: list[TrainingExample], minimum_rows: int = MIN_TRAINING_ROWS, minimum_per_class: int = MIN_PER_CLASS):
    accepted = sum(example.label == 1 for example in examples)
    declined = len(examples) - accepted
    active = (
        len(examples) >= minimum_rows
        and accepted >= minimum_per_class
        and declined >= minimum_per_class
    )
    confidence = max(
        0.0,
        min(1.0, (len(examples) - minimum_rows) / (FULL_INFLUENCE_ROWS - minimum_rows)),
    ) if active else 0.0

    result = {
        "active": active,
        "trainingExamples": len(examples),
        "acceptedExamples": accepted,
        "declinedExamples": declined,
        "confidence": confidence,
        "featureWeights": None,
    }
    if not active:
        return result, None

    weights = [0.0] * len(FEATURE_NAMES)
    bias = 0.0
    accepted_weight = len(examples) / (2 * accepted)
    declined_weight = len(examples) / (2 * declined)

    for _ in range(500):
        gradients = [0.0] * len(FEATURE_NAMES)
        bias_gradient = 0.0
        for example in examples:
            features = [float(example.features.get(name, 0.0)) for name in FEATURE_NAMES]
            probability = sigmoid(bias + sum(value * weights[index] for index, value in enumerate(features)))
            class_weight = accepted_weight if example.label == 1 else declined_weight
            error = (probability - example.label) * class_weight
            bias_gradient += error
            for index, value in enumerate(features):
                gradients[index] += error * value

        rate = 0.12 / len(examples)
        bias -= rate * bias_gradient
        for index in range(len(weights)):
            weights[index] -= rate * (gradients[index] + 0.8 * weights[index])

    result["featureWeights"] = {
        name: weights[index] for index, name in enumerate(FEATURE_NAMES)
    }
    return result, (weights, bias)


@app.get("/")
def home():
    return {
        "service": "PrideConnect Adaptive Recommender",
        "purpose": "Learn request acceptance and match relevance from numeric feedback.",
        "interactive_docs": "/docs",
        "health": "/health",
    }


@app.get("/health")
def health():
    return {"status": "ok", "model": "regularized logistic regression"}


@app.post("/predict", dependencies=[Depends(authorize)])
def predict(request: PredictRequest):
    model_info, parameters = fit(request.training_examples)
    relevance_info, relevance_parameters = fit(request.relevance_examples, minimum_rows=8, minimum_per_class=3)

    def predict_candidates(parameters):
        if parameters is None:
            return [None] * len(request.candidates)
        weights, bias = parameters
        probabilities = []
        for candidate in request.candidates:
            features = [float(candidate.features.get(name, 0.0)) for name in FEATURE_NAMES]
            probability = sigmoid(bias + sum(value * weights[index] for index, value in enumerate(features)))
            probabilities.append(round(probability, 8))
        return probabilities

    return {
        **model_info,
        "predictions": predict_candidates(parameters),
        "relevanceModel": relevance_info,
        "relevancePredictions": predict_candidates(relevance_parameters),
    }
