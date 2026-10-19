# Machine-learning experiment: predicting request acceptance

This report explains the project's trained model in everyday language first, then gives enough detail to reproduce and discuss the experiment. The central distinction is:

- The **live recommendations** shown by the web application come from explicit JavaScript similarity formulas in `src/lib/recommendation.js`, `src/lib/collaborative.js`, and `src/lib/hybrid.js`.
- The **trained neural model** described here is a separate research experiment in `ml/train_recommender.ipynb`. It is not loaded by the website and does not affect live match rankings.

## 1. The question the experiment asks

For a mentorship or connection request between two stakeholders, can a model estimate whether the request will be **accepted** or **declined**?

This is a binary classification problem: the model returns a number between 0 and 1. A number closer to 1 means “the model predicts acceptance”; a number closer to 0 means “the model predicts decline.” The experiment converts that score to a class using a 0.5 threshold for accuracy, precision, recall, and F1 calculations.

It is not the same task as the live recommender, which ranks people using profile overlap and accepted network relationships. The trained model predicts outcomes for request pairs; it does not decide which profiles should appear in the live recommendations list.

## 2. Data used

The experiment reads the fabricated demonstration records in `prisma/data/stakeholders.csv` and `prisma/data/interactions.csv`:

- 150 synthetic stakeholders.
- 441 request records in total: 208 mentorship and 233 connection requests.
- 69 pending requests are excluded because their outcomes are not known.
- 372 labeled requests remain: 198 accepted and 174 declined.
- Each labeled sender-recipient pair appears once. There are no repeated labeled pairs.

The requests are split at random, while preserving the acceptance/decline ratio, into 237 training rows, 60 validation rows, and 75 test rows. A row means one observed request. The same stakeholder can appear in more than one split through different request pairs, so this tests prediction for held-out interactions among the known synthetic users. It does not test generalization to entirely new users.

The data contains fabricated names and interactions, not records from Kenya Airways. The results therefore describe this experiment and dataset only.

## 3. What the model is

The notebook uses a small **Neural Collaborative Filtering (NCF)** architecture. “Neural” means the parameters are learned by a neural network during training. “Collaborative” means it tries to learn patterns from user interaction records.

### Inputs

For each request, the model receives:

1. The sender's stakeholder ID.
2. The recipient's stakeholder ID.
3. The request type, represented as two values: mentorship or connection.

The model does not currently receive profile skills, interests, departments, message text, ratings, or dates.

### Learned representation and network

Each of the 150 users is assigned a learned vector of 8 numbers, called an **embedding**. The model looks up one vector for the sender and one for the recipient. It joins those 16 numbers with the 2 request-type values, then passes the 18-number input through a dense layer with 16 units and a ReLU activation. A final layer and sigmoid function produce the acceptance score.

```text
sender ID ───────┐
                 ├─ 8-number user vectors ─┐
recipient ID ────┘                         ├─ 16-unit neural layer ─ output 0…1
request type ───────────── 2 values ───────┘
```

The embedding vectors start as learned parameters and are adjusted during training. They are not hand-written descriptions of a person's skills or personality.

### Training choices

- **Loss:** binary cross-entropy, which penalizes the model when its predicted probability is far from the known accepted/declined label.
- **Optimizer:** Adam, learning rate 0.005.
- **Regularization:** weight decay 0.01, which discourages excessively large learned parameters.
- **Training style:** full-batch, appropriate for this very small dataset.
- **Early stopping:** after 30 epochs without improved validation loss, training stops. The checkpoint with the best validation loss is used for the final test calculation.
- **Random seed:** 42 for NumPy and PyTorch operations in the notebook.

The model is intentionally small. With only 372 labeled examples, a larger network would have a high risk of memorizing training examples instead of learning patterns that transfer.

## 4. Results currently recorded

The checked-in values are in `ml/artifacts/metrics.json` and are summarized below.

| Test measure | Recorded result | Meaning |
|---|---:|---|
| Accuracy | 0.520 | Correct class on 52% of held-out rows at the 0.5 threshold. |
| Precision | 0.534 | Of rows predicted accepted, about 53% were accepted. |
| Recall | 0.775 | Of accepted test requests, about 78% were predicted accepted. |
| F1 | 0.633 | A single score balancing precision and recall. |
| ROC-AUC | 0.498 | Ability to rank accepted requests above declined ones; 0.5 is chance-level ranking. |
| Majority-class accuracy baseline | 0.532 | Accuracy from always predicting the more common class in the labeled dataset. |

The result does **not** show useful predictive performance: test accuracy is below the majority-class baseline, and ROC-AUC is approximately 0.5. High recall alone does not mean the predictions are good; the model can identify many accepted requests while also making many incorrect acceptance predictions.

### About the recorded “Precision@5” field

The checked-in `precision_at_5` value (`0.0278`) is a historical output from an earlier version of the notebook. That version divided the top-five hits by `min(5, number of accepted test requests for that sender)`, which is not standard Precision@5 when fewer than five accepted examples exist. The notebook cell has now been corrected: it divides hits by the number of ranked candidates (five here) and excludes the sender from their own candidate list. The checked-in metric artifact has **not** been regenerated with the corrected calculation, so do not quote its `precision_at_5` field as a standard metric. Rerun the notebook to produce a current value.

The classification metrics above and this ranking-style value are separate measurements. Neither is the live admin endpoint's profile-ranking diagnostic.

## 5. What the data sparsity means

Although each stakeholder may occur in several different requests, every individual sender-recipient pair occurs only once. There is consequently no repeated outcome for the same pair, and only a small number of request examples per stakeholder. That gives the embeddings little evidence from which to learn stable preferences. The random row split also leaves users in both training and test sets, so the experiment says nothing about brand-new users whose IDs were never seen during training.

The observed chance-level ROC-AUC is evidence that this particular model and dataset did not produce useful held-out predictions. It is not proof that all collaborative filtering methods must fail, or that the live hybrid recommender is empirically validated. The live system's content-heavy cold-start schedule is a reasoned prototype choice; it still needs independent evaluation with real, consented interaction data.

The plots in `ml/artifacts/loss_curve.png` and `ml/artifacts/embedding_space.png` are exploratory diagnostics. A two-dimensional PCA visualization is a compressed view of the learned vectors; visual clusters (or lack of clusters) alone do not establish model quality.

## 6. Why the model is not integrated into the website

The results do not support using its acceptance predictions to rank stakeholders. The live API at `/api/recommendations` therefore calculates content, collaborative, and hybrid scores from profile sets and accepted relationships. The notebook's `best_model.pt` checkpoint and exported user embeddings are research outputs only.

Keeping the model separate makes the production behavior inspectable and avoids presenting a near-random experimental prediction as a useful live recommendation. No NCF model checkpoint is required to run the web application.

## 7. How to reproduce the experiment

1. Open `ml/train_recommender.ipynb` in Google Colab (or a compatible Python environment).
2. Provide `prisma/data/stakeholders.csv` and `prisma/data/interactions.csv`. In Colab, use a `GITHUB_TOKEN` secret with repository read access, or upload the files when prompted.
3. Run the notebook from top to bottom. It can use CPU; a GPU is optional for this dataset.
4. Review the training and validation loss, test metrics, and generated plots.
5. The notebook writes metrics, embeddings, and figures to `/content/artifacts/` and checkpoints to Google Drive when mounted. Compare newly produced outputs with the checked-in files before replacing the recorded results.

See [`ml/README.md`](../ml/README.md) for setup details and [`docs/DATA.md`](DATA.md) for the seed dataset description.

## 8. What a stronger follow-up evaluation needs

- More real, consented request outcomes collected over time.
- A clear evaluation split. For future-user performance, split by user; for future-time performance, train on earlier requests and test on later ones.
- Baseline models, including a majority-class predictor and simple profile or user-history methods.
- Metrics chosen for the task, with each definition and denominator stated explicitly.
- Separate validation from final test decisions, and avoid tuning on the test set.
- Member feedback or relevance judgments to assess whether suggested mentors are actually useful.
- Privacy controls and data minimization before any real organizational data is used.
