# PrideConnect: Intelligent Stakeholder Matching

PrideConnect is a student-built web application that helps members of the Kenya Airways community discover mentors and professional peers. A member creates a profile with their skills and interests. The application compares that profile with other eligible profiles, uses accepted connections as an additional signal, and presents a ranked list of possible matches.

> **Project status:** Live database-backed application built for the Strathmore University capstone. It is an independent project, not an official Kenya Airways service. Production discovery and learning use records from the configured PostgreSQL database; bundled fabricated records are marked as demo data and excluded from production use.

## Start here

This repository contains the web application, a live adaptive machine-learning recommender, and a separate neural-network experiment:

| Part | What it does | Is it used by the live website? |
|---|---|---|
| Live adaptive recommender | Learns from resolved request outcomes, optional NCF member embeddings, and explicit usefulness feedback. It uses profile/network signals while evidence is limited. | Yes, when each model passes its evidence checks. |
| Neural Collaborative Filtering (NCF) | Trains from eligible, resolved database interactions in the Colab workflow and predicts request acceptance. | Shadow monitoring only; it currently has zero ranking influence. |
| Admin evaluation | Shows a proxy benchmark and a time-based, member-rated ranking holdout when enough feedback exists. | Admin-only diagnostics; neither replaces a prospective user evaluation. |

In simple terms, the live recommender reads profiles and interactions from PostgreSQL. It learns from real request outcomes and member ratings; synthetic demo accounts are excluded. The profile/network score ranks candidates, with direct relevance feedback blended in when supported. Acceptance likelihood is displayed separately, and NCF remains in shadow while it is compared against baselines. Recommendation impressions, views, dismissals, contacts, and ratings are recorded for future evaluation. Read [How matching works](#how-matching-works), [Colab model training](#train-and-publish-models-with-google-colab), and [Evaluation and limitations](#evaluation-and-limitations) for details.

## Train and publish models with Google Colab

`ml/colab_live_recommender.ipynb` is the offline trainer for the live app. It downloads eligible database outcomes as numeric compatibility features, labels, timestamps, and HMAC-keyed member pseudonyms from `/api/ml/training-data`; demo accounts are excluded, and names, email addresses, profile text, and message contents are never exported. It trains acceptance, recommendation-feedback, and embedding-based NCF models. Artifacts are checked using time-ordered holdouts; the app keeps NCF predictions in shadow with zero ranking influence. The endpoint marks the export as live-database data, and the artifact endpoint rejects uploads without that provenance marker. The notebook saves weights and metrics (not raw examples) to Google Drive and publishes weights to `/api/ml/artifacts`.

The website runs inference with the published weights stored in its database. NCF estimates are monitored but are not used to rank candidates until repeated evaluation supports activation. Colab can disconnect after publishing; it is not acting as a continuously running API. Apply all pending migrations to the target database before deployment. The new live-data migration marks existing `example.com` demo accounts and deactivates old model artifacts that lack training-data provenance; retrain and publish from the filtered export before expecting those models to be active. Add strong random `ML_COLAB_SYNC_TOKEN` and `ML_COLAB_USER_SALT` values to the server environment and keep the pseudonym salt stable between refreshes. In Colab, add Secrets named `PRIDECONNECT_APP_URL` (the site URL) and `ML_COLAB_SYNC_TOKEN` (the same sync secret; the salt stays on the app server), open `ml/colab_live_recommender.ipynb`, and run the cells. Use a separate Preview database while evaluating changes; do not use demo seed data in Production.

Acceptance training requires at least 12 resolved requests with at least four acceptances and four declines. Relevance training requires at least eight explicit ratings with at least three positive and three negative examples. NCF requires at least 80 resolved requests, 12 distinct members, at least 20 eligible later holdout examples from both classes, at least 40% known-member coverage, and holdout AUC of at least 0.52. Below those thresholds NCF is not activated and the profile based recommender remains available. Small sample counts and synthetic demo data are for workflow demonstrations, not proof of recommendation quality.

## What members can do

- Create an account and a stakeholder profile, then sign in with email and password. Google sign-in is available when configured.
- Find eligible stakeholders in a searchable directory.
- View recommended mentors and professional peers, including the shared skills and interests that explain a match.
- Send, receive, accept, or decline mentorship and connection requests.
- Share aviation opportunities and events, and RSVP to events.
- Report a member, event, or opportunity for administrator review; administrators can dismiss reports, suspend a reported member, or hide reported content.
- Delete a member account through Profile settings; the account is anonymized and removed from sign-in/discovery while linked activity records needed for integrity are retained.
- Filter the stakeholder directory by department as well as role, skill, interest, and search text.
- Opt in to Flight Reconnect by recording a route and date. A route match is shown only when both people consent to sharing.
- Let administrators verify accounts, suspend accounts, inspect platform activity, and view recommendation diagnostics.

Features are subject to role, verification, privacy, and authentication rules in the application. See [Privacy and safety](#privacy-and-safety).

## How matching works

The live application builds a ranked list for the signed-in member. When a mentorship or connection request is sent, the application stores a small snapshot of compatibility features. Once the recipient accepts or declines, that outcome becomes a labeled example for the live model. Members can also mark a suggested match useful or not useful; those ratings train a separate relevance model. The final list combines profile and network signals, both learned models when they have enough examples, and a diversity pass that reduces repetitive departments and roles. Pending requests are not training labels.

### 1. Profile similarity (content-based filtering)

The application compares two profiles' sets of skills and interests with the **Jaccard similarity** formula:

```text
Jaccard(A, B) = number of shared items / number of distinct items in either set
```

For example, if one person lists `{Python, data analysis}` and another lists `{Python, engineering}`, they share one skill and have three distinct skills between them. Their skill similarity is `1 / 3`.

The exact-match content score gives skills 60% of the score and interests 40%:

```text
content score = 0.60 × skill similarity + 0.40 × interest similarity
```

This score is between 0 and 1. The final profile score also includes a 22% domain-aware text-vector signal from profile skills, interests, department, and professional background/goals. A small aviation vocabulary map links common equivalent phrases (for example, “flight ops” and “flight operations”). Sparse text vectors are computed locally; they are not a pretrained language model, and no profile text is sent to the separate Python service. This helps with known domain wording but does not understand every synonym or sentence meaning.

### 2. Shared connection patterns (collaborative filtering)

The system treats accepted mentorship and connection requests as an undirected relationship: both people are considered connected, whoever sent the request. It compares two members by looking at the people each has connected with. It uses Jaccard similarity again, this time on those connection sets.

For a candidate, the system then asks: **did members with a connection pattern similar to the current member also connect with this candidate?** More similar members contribute a larger vote. The vote is normalized to produce a score between 0 and 1. If there is no overlapping connection history, this score is zero.

Pending and declined requests are not included in this live collaborative score. With little history, collaborative scores can be zero or weak. This is an expected limitation of a small or new community.

### 3. Learn from request outcomes

For each request, the model records twelve numeric signals from the time the request was sent: skill and interest overlap, same department, compatible mentor/mentee roles, mentorship topic fit, shared-network score, request type, profile text alignment, availability overlap by day and time, meeting-frequency fit, and whether both schedules could be interpreted. It learns weights for these signals from accepted and declined requests using regularized logistic regression. The output is an estimated probability of acceptance for a similar request.

Availability is not sent to an external language model. Members can explicitly select days, an exact start/end time or full day, meeting frequency, and a number of meetings or available hours. The app stores a readable schedule and turns it into numeric day-overlap, exact time-window overlap, frequency-fit, and parseability signals. Existing text such as “weekend mornings” is also understood. The profile page previews what matching reads, so members can correct unclear schedules. Unrecognized details remain unknown; the system does not guess that they mean all-day availability.

The fallback score gives content overlap 90% and the accepted-network signal 10% initially. It shifts toward 50% / 50% as accepted requests grow to 50. The ML model begins influencing ranks after at least 12 feature-snapshotted outcomes, including at least four accepted and four declined requests. Its influence then increases gradually, reaching full influence at 50 labeled examples. Until then, the fallback remains part of the ranking. These are conservative engineering schedules, not proof of accuracy.

```text
final ranking score = (1 − learning confidence) × cold-start score
                    + learning confidence × predicted acceptance probability
```

Eligible candidates are public, verified, non-suspended profiles other than the current member. A second logistic-regression model learns from explicit match ratings (ratings 4–5 mean useful; 1–2 mean not useful; 3 is neutral). It needs at least eight ratings, including three in each class, before it can influence the rank. Up to 12 candidates are then re-ranked with small penalties for over-representing the same department or role. The endpoint stores current score components, feature snapshot, and displayed rank. Both models are refit from stored examples when recommendations are requested; the hosted Python API remains optional.

### 4. Feedback, ranking variety, and evaluation

The match cards let a member rate a recommendation. The rating is saved with the numeric feature snapshot from the time the recommendation was displayed, so later feedback cannot silently change the training inputs. Each member's feedback informs that member's own relevance ranker; administrator diagnostics summarize feedback across accounts. A member can change their rating later.

The final list uses a greedy diversity re-ranker after scoring. It keeps strong scores while gently reducing repeated departments and roles near the top. The adjustment and profile text alignment are visible in the admin simulation. Diversity is a ranking preference, not an employment or eligibility decision.

The admin page also evaluates both learned models on chronological holdouts: the newest 20% of resolved request outcomes or match ratings are scored by a model fit only on older examples. It reports holdout ROC-AUC and Brier score when both periods contain both classes. These internal checks are distinct from the profile-overlap proxy benchmark and are not proof of real-world quality.

### A worked example

Suppose the cold-start score is `0.65`, the learned model estimates `0.75`, and learning confidence is `0.50`:

```text
final score = (0.50 × 0.65) + (0.50 × 0.75)
            = 0.70 (70%)
```

At full learning confidence, the ranking is driven by the model's estimated acceptance probability. During the transition, the final match score is a blend and should not be described as a calibrated probability.

The live learning and feature extraction are in [`src/lib/adaptive-recommender.js`](src/lib/adaptive-recommender.js). The request APIs save feature snapshots, Prisma stores them on each request, and the authenticated ranking endpoint is [`src/app/api/recommendations/route.js`](src/app/api/recommendations/route.js).

## Machine-learning experiment

The project also includes an older research notebook in [`ml/train_recommender.ipynb`](ml/train_recommender.ipynb), evaluated on fabricated data. Its results are not used by the live site. The live NCF model is trained separately by `ml/colab_live_recommender.ipynb` from eligible PostgreSQL outcomes and is activated only after its holdout checks pass.

It uses the sender, recipient, and request type (mentorship or connection) as inputs. Learned user embeddings represent each stakeholder as a short list of numbers; a small neural network combines the two people’s embeddings and request type and outputs a predicted acceptance score. The experiment uses a train/validation/test split, binary cross-entropy loss, Adam optimization, regularization, and early stopping. This notebook's trained NCF model is separate from the JavaScript logistic-regression model used by the live recommender.

The older experiment's ROC-AUC is approximately `0.498`, close to random ranking (`0.5`). Test accuracy is `0.52`, below the majority-class baseline of approximately `0.532`. These figures apply only to the fabricated research dataset. Live-model quality must be judged from the live-data holdout metrics shown in the Admin Console; passing a threshold is not a guarantee of real-world benefit.

The notebook, its limitations, the exported artifacts, and instructions to rerun it in Google Colab are explained in [`docs/ML_MODEL.md`](docs/ML_MODEL.md) and [`ml/README.md`](ml/README.md).

### Host the live recommender separately

The Python API is prepared in [`ml/huggingface/`](ml/huggingface/). Hugging Face Docker Spaces need a paid plan, so a free option is Render's Python Web Service. After these project changes are pushed to GitHub, connect the repository in Render and fill these service settings:

| Setting | Value |
|---|---|
| Root Directory | `ml/huggingface` |
| Language | `Python 3` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn app:app --host 0.0.0.0 --port $PORT` |
| Instance Type | `Free` |

Add `ML_SERVICE_TOKEN` in Render's environment settings. Set `ML_SERVICE_URL` to the Render service URL and set `ML_SERVICE_TOKEN` to the same secret in the web app's server environment. Render's [FastAPI deployment guide](https://render.com/docs/deploy-fastapi) and [monorepo guide](https://render.com/docs/monorepo-support) cover these settings.

The web app sends only numeric feature examples and candidate features to that service. PostgreSQL remains the source of request outcomes; each inference call fits from the stored examples, so the host does not need its own copy of the database. Render's free service sleeps after 15 minutes without traffic and can take about a minute to wake. Open its `/health` URL shortly before a demo; if the service is still unavailable, the web app uses its local copy of the same model. [Render free-service limits](https://render.com/docs/free)

## Evaluation and limitations

The admin evaluation endpoint calculates Precision@5, Recall@5, NDCG@10, and Mean Reciprocal Rank (MRR) for content-only, collaborative-only, and fallback hybrid rankings. It also displays model example counts, member relevance ratings, and a time-separated holdout check for request acceptance. In plain language:

- **Precision@5:** of the first five profiles shown, what fraction meet the evaluation's relevance rule?
- **Recall@5:** of all profiles that meet that rule, what fraction appear in the first five?
- **NDCG@10:** are relevant profiles near the top of the first ten, where higher positions count more?
- **MRR:** how high in the list does the first relevant profile appear, on average?

For this prototype, a profile is marked “relevant” if it shares at least two skills with the member **or** has an accepted connection with them. Metrics are averaged across evaluated members who have at least one profile meeting that rule. This is a designed proxy label, not a real person's judgment. It also reuses skills, which are inputs to content scoring. Therefore these dashboard metrics are useful for checking how ranking methods behave against the rule, but they are not independent proof that recommendations are useful, fair, or accurate in practice. There is no user acceptance study included in the repository.

The live models' time-based holdouts are internal diagnostics on eligible database records. The older NCF experiment is evaluated separately on fabricated rows. The admin endpoint's proxy ranking metrics and the models' holdout metrics answer different questions; do not compare them as if they measured the same task.

Key limitations to keep in mind:

1. **Development seed data:** the repository includes fabricated accounts and interactions for local demos. They are marked as demo records, excluded from live member discovery and model training, and must not be loaded into Production.
2. **Sparse collaboration signal:** real systems need repeated, consented interaction outcomes to learn member preferences. NCF remains inactive until its live-data coverage and time-holdout quality gates pass.
3. **Prototype relevance labels:** the admin benchmark defines relevance from shared skills and existing accepted links rather than independent human judgments.
4. **Cold-start settings:** the live model's minimum sample counts and gradual transition are hand-set prototype values, not optimized or validated on a large real dataset.
5. **Limited evaluation evidence:** a chronological holdout is now reported when enough examples exist, but it is small, internal, and does not replace an independent user study or consented production validation.
6. **Model evidence:** the live logistic and NCF models are learned from database outcomes, but a passed internal threshold does not establish fairness or usefulness. Continue monitoring holdout results and collect member feedback before making strong performance claims.

To evaluate real recommendation quality, the project needs consented real usage data, a time-aware or otherwise leakage-resistant evaluation split, relevance judgments from members, baseline comparisons, and a user study. Until then, present the current metrics as prototype diagnostics.

The repository includes a participant questionnaire, manual baseline protocol, and a bounded localhost-only performance smoke harness in [`docs/EVALUATION_PROTOCOL.md`](docs/EVALUATION_PROTOCOL.md). These are procedures, not evidence that a participant study or load test has already been completed. Run `node scripts/performance-smoke.mjs http://localhost:3000 20 2` against a running local app; set `PERF_PATH` and (for authenticated APIs) `PERF_COOKIE` in the local process environment as described in the protocol.

## System overview

```text
Browser (Next.js / React)
        │ authenticated requests
        ▼
Next.js pages and API routes
        │ Prisma ORM
        ▼
PostgreSQL database
        ▲
        │ request snapshots + accepted/declined labels
        └─ Next.js sends numeric examples to a hosted Python API (or local fallback)

Separate offline experiment:
CSV demonstration data → Google Colab / PyTorch NCF → evaluation artifacts
                                          (separate from live model)
```

- **Web application:** Next.js 16 App Router and React 19, written primarily in JavaScript.
- **Authentication:** NextAuth credentials and optional Google OAuth.
- **Database:** PostgreSQL accessed through Prisma.
- **Live ML:** regularized logistic regression, available as a JavaScript local fallback and an optional hosted Python API, retrained from new in-app request outcomes stored in PostgreSQL.
- **Separate training experiment:** Python notebook using PyTorch, pandas, NumPy, scikit-learn, and matplotlib in Google Colab.

Useful project locations:

| Path | Purpose |
|---|---|
| `src/app/` | Pages and API routes. |
| `src/lib/` | Authentication, database setup, and recommendation scoring. |
| `src/components/` | Shared interface components. |
| `prisma/schema.prisma` | Database tables, relationships, and enums. |
| `prisma/data/` | Fabricated CSV seed data. |
| `prisma/seed.cjs` | Loads the CSV records into PostgreSQL. |
| `ml/train_recommender.ipynb` | Standalone NCF training and evaluation notebook. |
| `ml/huggingface/` | Python API service for hosting the live adaptive recommender separately. |
| `ml/artifacts/` | Saved experiment metrics, embeddings, and plots. |
| `docs/ML_MODEL.md` | Detailed model method, results, and limitations. |

## Getting started locally

### Requirements

- Node.js 22 or newer (`.nvmrc` records the project version).
- npm.
- Docker Desktop (for the supplied local PostgreSQL service), or another PostgreSQL database.
- Git to clone the repository.

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the database and environment

Copy `.env.example` to `.env`. The supplied Docker Compose file creates a local database with the connection string already shown in `.env.example`.

Start PostgreSQL:

```bash
docker compose up -d postgres
```

Set `DATABASE_URL` in `.env` to your PostgreSQL connection string. Keep `.env` private and do not commit it.

`NEXTAUTH_SECRET` is needed for signed sessions. `APP_URL` (or `NEXTAUTH_URL`) is used to create verification and administrator-invitation links. On Vercel Production, set `APP_URL` to the stable public site URL (for example, `https://your-project.vercel.app`), never `http://localhost:3000`. If `APP_URL` is accidentally set to localhost in Production, the app ignores it and uses Vercel's production project domain or another public URL. Redeploy after changing environment variables. Google OAuth and Gmail SMTP are optional integrations; configure `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GMAIL_USER`, and `GMAIL_APP_PASSWORD` if you want Google sign-in and email delivery. Use a Google App Password for `strathtank@gmail.com`, not the mailbox's normal password.

Administrators can invite another administrator from **Admin Console → Administrator Access** using the email address on that person's Google account. The recipient must open the one-time email link and set a password before elevated access activates; after activation they can sign in with that password or Google using the same email. Invitations expire after 24 hours and can be revoked or resent from the panel. Invitation and verification emails use Gmail SMTP; set `GMAIL_USER`, `GMAIL_APP_PASSWORD`, and a valid public `APP_URL` or `NEXTAUTH_URL` in the deployed environment. Vercel provides its stable production domain as a fallback if `APP_URL` is accidentally left at localhost. The final active administrator cannot remove their own access or remove the last other administrator.

The Admin Console **Audit Log** records member and administrator sign-ins and key actions across profiles, connection and mentorship requests, messages, events, opportunities, feedback, Flight Reconnect, and account governance. Each entry names the actor and, when relevant, the affected account. Audit records use the existing `AdminAction` table and need no schema migration.

### 3. Create tables and (optionally) load local demonstration data

```bash
npm run db:push
npm run seed
```

`db:push` applies the Prisma schema to the configured database. Apply all pending schema changes, including `isDemo`, before deploying. The `seed` command is for local development/demo databases only and refuses to run when `NODE_ENV=production`. It creates fabricated users and interactions marked as demo records; live directory results, admin metrics, and model training exclude them. Do not run the seed against a live database.

For a hosted demo, create a **separate, empty PostgreSQL database/project** (do not clone production data). Apply the schema and load the fabricated dataset into that database only:

```powershell
$env:DATABASE_URL = "<new-demo-database-connection-string>"
npm run db:push
npm run seed
Remove-Item Env:DATABASE_URL
```

Then add that same `DATABASE_URL` in Vercel with the **Preview** environment selected, leaving Production unchanged. Ensure Preview has its own authentication and ML secrets. For the live service, point Production to its live PostgreSQL database and do not run the demo seed. For local setup, use the same PowerShell commands and start the app with `npm run dev`.

For current sample data counts and how it is generated, see [`docs/DATA.md`](docs/DATA.md).

### 4. Run the website

```bash
npm run dev
```

Open <http://localhost:3000>. Sign in with a seeded stakeholder or the seeded admin account (`admin@example.com`); the local seed password is `Test1234!` for both. Do not expose seeded credentials or the seeded database to the public internet.

### Other project commands

```bash
npm run lint       # Check JavaScript and React code
npm test           # Run unit and integration tests
npm run build      # Generate Prisma client and build the Next.js app
npm run test:performance -- http://localhost:3000 20 2 # Bounded localhost smoke test
npm run start      # Serve a previously built app
```

## Data model and privacy

The database separates accounts from stakeholder profiles. Profiles link to skills, interests, and seeking/offering mentorship topics through join tables. Mentorship and connection requests store twelve numeric compatibility features captured at send time, including schedule overlap parsed from availability text; once resolved, those features and the accept/decline outcome provide examples for the adaptive recommender. Recommendation impressions preserve their rank and score snapshot; feedback stores its own feature snapshot for the member relevance model. Mentorship partners can mark a mentorship complete and rate usefulness afterward. Members should be told clearly that outcomes and match ratings help improve recommendations. Opportunities, events, event participation, and flight reconnect records support the other modules. The complete schema is [`prisma/schema.prisma`](prisma/schema.prisma).

Registration and sign-in are authenticated flows. Public profile visibility, verification, and suspension affect eligibility. Flight Reconnect requires consent from both people before a match is exposed. This is a research prototype, so it should not be used to store real passenger itineraries or other sensitive operational data without an appropriate privacy and security review.

Member account deletion is a soft-delete/anonymization workflow, not a physical row deletion: sign-in and public discovery are disabled, profile fields and selected personal text are anonymized or cleared, and certain linked records remain for relationship integrity and moderation history. Community reports can contain sensitive descriptions, are restricted to administrators, and are redacted when the reporter deletes their account. Apply the Prisma schema changes before deploying these features.

## Documentation guide

- [Machine-learning model report](docs/ML_MODEL.md): NCF design, experiment, measured results, and limitations.
- [ML notebook instructions](ml/README.md): run the experiment in Colab and understand its outputs.
- [Data guide](docs/DATA.md): source, shape, synthetic nature, and seeding behavior of the CSV files.
- [AI development disclosure](docs/AI_USAGE.md): how AI tools were used during development.
- [Project roadmap](docs/ROADMAP.md): current implementation status and remaining work.
- [Recommendation evaluation protocol](docs/EVALUATION_PROTOCOL.md): participant questionnaire, manual baseline protocol, and bounded local performance smoke test.

## Academic information

- **Project:** Intelligent Stakeholder Matching for Mentorship and Professional Networking Using Hybrid Recommendation Techniques: A Case of Kenya Airways
- **Author:** Kamau Edwin Kamau (Admission No. 152803)
- **Course:** Informatics and Computer Sciences, ICS 4 Group B
- **Institution:** Strathmore University, Nairobi, Kenya
- **Supervisor:** Madam Julliet Kirui
- **Prototype date:** June 2026

## Disclaimer and license

This is an academic capstone prototype, not an officially deployed Kenya Airways product. Kenya Airways names and marks belong to their respective owners. The project is distributed under the MIT License; see [`LICENSE`](LICENSE).
