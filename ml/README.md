# ML: NCF accept/decline model

A standalone Colab training notebook and its results — see
[`docs/ML_MODEL.md`](../docs/ML_MODEL.md) for the full writeup (what's
trained, why, and what it found).

## Files

- `train_recommender.ipynb` — the notebook. Open in
  [Google Colab](https://colab.research.google.com/), run all cells. It
  mounts your Google Drive, clones this repo to read
  `prisma/data/*.csv`, trains a small Neural Collaborative Filtering (NCF)
  model, evaluates it, and saves checkpoints to
  `/content/drive/MyDrive/ism-checkpoints/`.
- `artifacts/` — outputs from an actual run: `metrics.json` (full eval
  results), `embeddings.json` (learned user embeddings, keyed by CSV
  `user_id`), `loss_curve.png`, `embedding_space.png`.

## Running it yourself

1. Open `train_recommender.ipynb` in Colab (upload it, or open directly from
   GitHub via Colab's File → Open notebook → GitHub tab).
2. Runtime → Change runtime type → GPU (optional — the notebook works on
   CPU too, and this dataset is small enough that GPU makes no practical
   difference here).
3. Run all cells. You'll be prompted to authorize Google Drive access.
4. Once finished, `/content/artifacts/` has the same files as this repo's
   `artifacts/` directory. Download them and replace the checked-in copies
   if you want this run's results to become the recorded ones.

## Why this is separate from the live app

The trained model's output is **not** wired into `/api/recommendations` or
any other live route — it's a research/evaluation artifact for the report
and demo. See "Integration" in `docs/ML_MODEL.md` for why.
