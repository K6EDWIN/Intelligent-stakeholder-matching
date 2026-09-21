# Trained Model: Neural Collaborative Filtering for Accept/Decline Prediction

This documents the one genuinely *trained* component in the project — a
model with learned weights, checkpoints, and an evaluation run — as distinct
from the live recommendation engine (`src/lib/recommendation.js`,
`collaborative.js`, `hybrid.js`), which is entirely hand-specified
similarity/weighting math with no training step. See
[`AI_USAGE.md`](AI_USAGE.md) for how this fits into the wider development
pipeline, and [`ml/README.md`](../ml/README.md) for how to run it yourself.

## What's trained, and on what

A small Neural Collaborative Filtering (NCF) model, trained in
[`ml/train_recommender.ipynb`](../ml/train_recommender.ipynb) (Google
Colab, GPU-capable, checkpoints to Google Drive) on the same synthetic
dataset described in [`DATA.md`](DATA.md):
`prisma/data/stakeholders.csv` (150 users) and
`prisma/data/interactions.csv` (441 mentorship/connection requests).

## Why accept/decline prediction, not rating prediction

The data supports classification much better than regression here:
- **Accept/decline**: 372 labeled examples (every row where
  `status != PENDING`) — 198 `ACCEPTED`, 174 `DECLINED`. Balanced, and both
  classes carry signal.
- **Rating prediction**: only 198 rows have a rating at all (the `ACCEPTED`
  ones), and every one of those ratings is inherently a "positive" example
  (nobody rates a declined request) — a much weaker, one-sided training
  signal for a fraction of the data.

## Architecture

- One shared `Embedding(num_users=150, dim=8)` table, looked up by both
  sender and receiver index (same embedding space for both roles).
- `concat([sender_emb, receiver_emb, request_type_onehot(2)])` → `Linear(18→16)
  → ReLU → Linear(16→1) → Sigmoid`, predicting P(accepted).
- Loss: binary cross-entropy. Optimizer: Adam, `lr=0.005`,
  `weight_decay=1e-2`. Early stopping on a held-out validation split
  (patience 30 epochs).

Deliberately small — with ~150 users and ~300 training examples, a larger
model has nothing to gain and everything to overfit.

## Results (from an actual run — see `ml/artifacts/metrics.json`)

| Metric | Value |
|---|---|
| Test accuracy | 0.52 |
| Test precision | 0.53 |
| Test recall | 0.78 |
| Test F1 | 0.63 |
| Test ROC-AUC | **0.498** |
| Majority-class baseline | 0.532 |
| Precision@5 (ranking eval) | 0.028 |

## The finding: this model does not generalize, and here's why

ROC-AUC of 0.498 is indistinguishable from random guessing (0.5). The model
does **not** beat the trivial majority-class baseline. This is not a bug —
it's a real, checked finding:

```
unique (sender, recipient) pairs: 372 / 372 rows
pairs seen more than once: 0
```

**Every single interaction in the dataset is between a pair of users who
never interact again elsewhere in the data.** Collaborative filtering —
learned or heuristic — works by finding structure in *repeated* co-occurrence
(“people who connected with X also connected with Y”). With zero repeated
pairs, there is nothing of that shape for an embedding to learn: each
training example is an isolated, one-off observation about two specific
users, and embeddings trained that way have no way to generalize to unseen
pairs at test time.

This was verified to be a genuine data-sparsity ceiling, not an
implementation mistake: an earlier, unregularized version of the same model
(no weight decay, no early stopping — see commit history) fit the *training*
set to near-zero loss (0.0004), confirming the architecture has the capacity
to learn — it simply has nothing generalizable available to learn from at
this interaction volume. The loss curve in `ml/artifacts/loss_curve.png`
shows the textbook shape: validation loss bottoms out at epoch 22 while
training loss keeps falling, the standard signature of overfitting rather
than an undertrained or broken model. The PCA plot of learned embeddings
(`ml/artifacts/embedding_space.png`) shows no meaningful clustering by
`UserRole` either, consistent with the embeddings not having learned
transferable structure.

## Why this result matters, not just what it says

This directly validates a design decision already made in the live app.
`src/lib/hybrid.js` computes `hybridScore = alpha * contentScore + beta *
collaborativeScore`, where `alpha` starts at **0.9** (heavily favoring
content-based similarity) and only decays toward 0.5 as the platform
accumulates *many* accepted interactions — explicitly reasoned, in that
file's own comments, as a cold-start mitigation for exactly this situation:
sparse interaction data. This training run is empirical confirmation of that
reasoning, not just a plausible-sounding comment — with this little
repeated-interaction structure, a purely collaborative signal (learned or
heuristic) is close to noise, and leaning on content similarity is the
correct call.

## Integration with the live app: deliberately none

This trained model's output does **not** feed into `/api/recommendations`
or any other live route. Given the finding above, wiring an
effectively-random model into production ranking would make recommendations
worse, not better. It exists as a standalone research/evaluation artifact —
real training infrastructure (Colab, GPU-capable, GDrive checkpoints), a
proper train/val/test methodology, and an honestly-reported result, kept
separate from what actually serves users.

## What would change this result

More accumulated real interaction data, specifically **repeated
co-occurrence** — the same users (or users with overlapping social graphs)
interacting multiple times, which only happens with sustained real usage
over time, not a one-shot synthetic dataset. If/when the platform has that,
re-running this same notebook against real `MentorshipRequest`/
`ConnectionRequest` data is the natural next step, and the
`Precision@5` ranking-evaluation cell in the notebook doubles as a
template for the Precision@K/Recall@K/NDCG evaluation work in
[issue #11](https://github.com/K6EDWIN/Intelligent-stakeholder-matching/issues/11).
