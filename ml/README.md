# Machine-learning experiment

This folder contains a small Neural Collaborative Filtering (NCF) experiment. In everyday terms, it tests whether a neural network can predict if an already-sent mentorship or connection request will be accepted or declined.

For the live-app training workflow, see [`colab_live_recommender.ipynb`](colab_live_recommender.ipynb). It trains both the numeric outcome models and the NCF embedding model from app-collected resolved interactions, saves model weights to Google Drive, and publishes quality-checked weights to the app for inference. It is adapted from the NCF architecture below, but trains on the app's own history rather than only the checked-in fabricated CSV files.

**This NCF notebook is not the live recommendation engine.** The website now learns from newly resolved mentorship and connection requests with a separate lightweight logistic-regression model in `src/lib/adaptive-recommender.js`. The NCF model and its embeddings remain notebook research artifacts because its synthetic-data results were near chance. The live model and both sets of limitations are detailed in [`docs/ML_MODEL.md`](../docs/ML_MODEL.md).

## Files

- `train_recommender.ipynb` — training and evaluation notebook for Google Colab or a compatible Python environment. It reads `prisma/data/stakeholders.csv` and `prisma/data/interactions.csv`, trains a small PyTorch model, and saves metrics, plots, and user embeddings.
- `artifacts/metrics.json` — recorded data counts and test metrics from the checked-in experiment.
- `artifacts/loss_curve.png` — training and validation loss over epochs. A widening gap can indicate memorization/overfitting.
- `artifacts/embedding_space.png` — a two-dimensional PCA view of the learned user vectors, colored by role. It is an exploratory picture, not a quality score.
- `artifacts/embeddings.json` — learned 8-number vectors keyed by the CSV user IDs. They are useful for inspecting the experiment, but are not loaded by the application.

## Run in Google Colab

1. Open `train_recommender.ipynb` in Colab (or upload the notebook).
2. If desired, select a GPU under Runtime → Change runtime type. CPU is sufficient for this small dataset.
3. The data-loading cell will try to read the repository files. This project repository is private, so provide either:
   - a Colab Secret named `GITHUB_TOKEN`, with notebook access enabled and a token that can read this repository; or
   - upload `stakeholders.csv` and `interactions.csv` when the notebook asks.
4. Run all cells from top to bottom. Authorize Google Drive when asked; checkpoints are saved under `MyDrive/ism-checkpoints/`.
5. Download outputs from `/content/artifacts/` if you want to compare them with the checked-in artifacts. Replace the checked-in results only after reviewing the new run and updating the report.

The Colab notebook picker may use your signed-in GitHub account to open the private notebook, while the notebook's own data-loading cell uses `GITHUB_TOKEN` or file upload. These are separate access paths.

## Understand the recorded outcome

The available labeled data contains 372 accepted/declined requests, but every sender-recipient pair appears only once. The current model's recorded test ROC-AUC is about `0.498`, approximately chance-level, and its accuracy (`0.520`) is below the majority-class baseline (`0.532`). The result does not demonstrate useful predictive performance. The dataset is fabricated and small, so this should not be generalized to real stakeholders.

The checked-in `precision_at_5` field is a historical value from an earlier notebook version and used a nonstandard denominator. The notebook has since been corrected to calculate standard Precision@5 (excluding the sender as a candidate), but the artifacts have not been regenerated. Do not compare the old artifact value with standard Precision@5 results; rerun the notebook to get an updated value. See [`docs/ML_MODEL.md`](../docs/ML_MODEL.md).

## Host the live recommender separately

The live adaptive recommendation service is prepared in [`huggingface/`](huggingface/). It is a Docker API that fits an acceptance model from resolved request outcomes and a separate relevance model from explicit member ratings. The app sends only numeric feature vectors and labels; profile text is vectorized locally in the web app. This is separate from the NCF notebook above. Redeploy the Python service when changing its request or response contract. Follow the deployment steps in the main [README](../README.md#host-the-live-recommender-separately) and the Space-specific [`README`](huggingface/README.md).

## Why this NCF model stays separate

The NCF model did not show reliable predictive value on this dataset. The live website uses a different model that learns from request outcomes captured by the running application. The live `/api/recommendations` route does not load this notebook's checkpoint or embeddings. Running the website does not require Python, Colab, or files from this folder.
