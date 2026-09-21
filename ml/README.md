# ML: NCF accept/decline model

A standalone Colab training notebook and its results — see
[`docs/ML_MODEL.md`](../docs/ML_MODEL.md) for the full writeup (what's
trained, why, and what it found).

## Files

- `train_recommender.ipynb` — the notebook. Open in
  [Google Colab](https://colab.research.google.com/), run all cells. It
  mounts your Google Drive, gets `prisma/data/*.csv` from this repo (see
  "This repo is private" below), trains a small Neural Collaborative
  Filtering (NCF) model, evaluates it, and saves checkpoints to
  `/content/drive/MyDrive/ism-checkpoints/`.
- `artifacts/` — outputs from an actual run: `metrics.json` (full eval
  results), `embeddings.json` (learned user embeddings, keyed by CSV
  `user_id`), `loss_curve.png`, `embedding_space.png`.

## This repo is private

An anonymous `git clone` (no auth) fails silently against a private repo in
Colab — the data-loading cell handles this two ways:

- **With a token (recommended, keeps data in sync automatically)**: in
  Colab, open the Secrets panel (key icon, left sidebar), add a secret named
  `GITHUB_TOKEN` with a GitHub personal access token that has read access to
  this repo, and toggle "Notebook access" on. Re-run the cell.
- **Without one**: the cell falls back to prompting you to upload
  `stakeholders.csv` and `interactions.csv` directly (from `prisma/data/` in
  your local checkout). Works immediately, no setup, just won't auto-update
  on a later run.

## Running it yourself

1. Open `train_recommender.ipynb` in Colab (upload it, or open directly from
   GitHub via Colab's File → Open notebook → GitHub tab — that picker uses
   your own GitHub OAuth session, separate from the `git clone` cell above,
   so it works against the private repo as long as you're signed in with an
   account that has access).
2. Runtime → Change runtime type → GPU (optional — the notebook works on
   CPU too, and this dataset is small enough that GPU makes no practical
   difference here).
3. Run all cells. You'll be prompted to authorize Google Drive access, and
   either provide the `GITHUB_TOKEN` secret or upload the two CSVs when the
   data-loading cell asks.
4. Once finished, `/content/artifacts/` has the same files as this repo's
   `artifacts/` directory. Download them and replace the checked-in copies
   if you want this run's results to become the recorded ones.

## Why this is separate from the live app

The trained model's output is **not** wired into `/api/recommendations` or
any other live route — it's a research/evaluation artifact for the report
and demo. See "Integration" in `docs/ML_MODEL.md` for why.
