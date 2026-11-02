# PrideConnect: Intelligent Stakeholder Matching

PrideConnect is a student-built web application that helps members of the Kenya Airways community discover mentors and professional peers. A member creates a profile with their skills and interests. The application compares that profile with other eligible profiles, uses accepted connections as an additional signal, and presents a ranked list of possible matches.

> **Project status:** Academic prototype for the Strathmore University capstone. It is not an official Kenya Airways service. The included people and interaction history are fabricated demonstration data, not real Kenya Airways records.

## Start here

This repository contains the web application, a live adaptive machine-learning recommender, and a separate neural-network experiment:

| Part | What it does | Is it used by the live website? |
|---|---|---|
| Live adaptive recommender | Learns from real request accept/decline outcomes and adjusts match rankings over time. It uses profile/network signals while evidence is limited. | Yes. |
| Neural Collaborative Filtering (NCF) experiment | Trains a small neural network on fabricated request examples. It did not beat a simple baseline. | No. It remains a separate research notebook. |
| Admin evaluation | Compares live ranking formulas against a rule-based definition of a “relevant” profile. | Admin-only diagnostic; it is not an independent user study or held-out validation. |

In simple terms, the live recommender learns how request outcomes relate to profile compatibility, mentorship fit, and past network patterns. A small cold-start formula supports it until enough real outcomes exist. The NCF notebook is a separate experiment; its result was not strong enough to use in the live product. Read [How matching works](#how-matching-works), [Machine-learning experiment](#machine-learning-experiment), and [Evaluation and limitations](#evaluation-and-limitations) for the details.

## What members can do

- Create an account and a stakeholder profile, then sign in with email and password. Google sign-in is available when configured.
- Find eligible stakeholders in a searchable directory.
- View recommended mentors and professional peers, including the shared skills and interests that explain a match.
- Send, receive, accept, or decline mentorship and connection requests.
- Share aviation opportunities and events, and RSVP to events.
- Opt in to Flight Reconnect by recording a route and date. A route match is shown only when both people consent to sharing.
- Let administrators verify accounts, suspend accounts, inspect platform activity, and view recommendation diagnostics.

Features are subject to role, verification, privacy, and authentication rules in the application. See [Privacy and safety](#privacy-and-safety).

## How matching works

The live application builds a ranked list for the signed-in member. When a mentorship or connection request is sent, the application stores a small snapshot of compatibility features. Once the recipient accepts or declines, that outcome becomes a labeled example for the live model. When recommendations are requested, the application retrains a compact logistic-regression model from those resolved examples and uses its acceptance estimate to influence rankings. Pending requests are not training labels.

### 1. Profile similarity (content-based filtering)

The application compares two profiles' sets of skills and interests with the **Jaccard similarity** formula:

```text
Jaccard(A, B) = number of shared items / number of distinct items in either set
```

For example, if one person lists `{Python, data analysis}` and another lists `{Python, engineering}`, they share one skill and have three distinct skills between them. Their skill similarity is `1 / 3`.

The content score gives skills 60% of the score and interests 40%:

```text
content score = 0.60 × skill similarity + 0.40 × interest similarity
```

This score is between 0 and 1. A higher score means the profiles overlap more on those fields. Skills and interests are the only profile fields used by this live score today; department, bio, career goals, and mentorship role are not included in this formula.

### 2. Shared connection patterns (collaborative filtering)

The system treats accepted mentorship and connection requests as an undirected relationship: both people are considered connected, whoever sent the request. It compares two members by looking at the people each has connected with. It uses Jaccard similarity again, this time on those connection sets.

For a candidate, the system then asks: **did members with a connection pattern similar to the current member also connect with this candidate?** More similar members contribute a larger vote. The vote is normalized to produce a score between 0 and 1. If there is no overlapping connection history, this score is zero.

Pending and declined requests are not included in this live collaborative score. With little history, collaborative scores can be zero or weak. This is an expected limitation of a small or new community.

### 3. Learn from request outcomes

For each request, the model records six numeric signals from the time the request was sent: skill overlap, interest overlap, same department, mentorship-role fit, shared-network score, and request type. It learns weights for these signals from accepted and declined requests using regularized logistic regression. The output is an estimated probability of acceptance for a similar request.

The fallback score gives content overlap 90% and the accepted-network signal 10% initially. It shifts toward 50% / 50% as accepted requests grow to 50. The ML model begins influencing ranks after at least 12 feature-snapshotted outcomes, including at least four accepted and four declined requests. Its influence then increases gradually, reaching full influence at 50 labeled examples. Until then, the fallback remains part of the ranking. These are conservative engineering schedules, not proof of accuracy.

```text
final ranking score = (1 − learning confidence) × cold-start score
                    + learning confidence × predicted acceptance probability
```

Eligible candidates are public, verified, non-suspended profiles other than the current member. The endpoint stores current score components and returns up to 12 candidates ordered by the final score. The interface shows the predicted acceptance estimate and the current number of training examples. The model is retrained from stored examples when recommendations are requested; no separate ML server or Python runtime is required.

### A worked example

Suppose the cold-start score is `0.65`, the learned model estimates `0.75`, and learning confidence is `0.50`:

```text
final score = (0.50 × 0.65) + (0.50 × 0.75)
            = 0.70 (70%)
```

At full learning confidence, the ranking is driven by the model's estimated acceptance probability. During the transition, the final match score is a blend and should not be described as a calibrated probability.

The live learning and feature extraction are in [`src/lib/adaptive-recommender.js`](src/lib/adaptive-recommender.js). The request APIs save feature snapshots, Prisma stores them on each request, and the authenticated ranking endpoint is [`src/app/api/recommendations/route.js`](src/app/api/recommendations/route.js).

## Machine-learning experiment

The project also includes a separately trained Neural Collaborative Filtering (NCF) model in [`ml/train_recommender.ipynb`](ml/train_recommender.ipynb). It asks whether a neural network can predict acceptance from user IDs and request type. Its synthetic-data result was around chance, so it is not the model used in the live site. The live logistic-regression model is described above and learns only from new requests whose compatibility features were saved by the application.

It uses the sender, recipient, and request type (mentorship or connection) as inputs. Learned user embeddings represent each stakeholder as a short list of numbers; a small neural network combines the two people’s embeddings and request type and outputs a predicted acceptance score. The experiment uses a train/validation/test split, binary cross-entropy loss, Adam optimization, regularization, and early stopping. This notebook's trained NCF model is separate from the JavaScript logistic-regression model used by the live recommender.

The NCF test ROC-AUC is approximately `0.498`, close to random ranking (`0.5`). Test accuracy is `0.52`, below the majority-class baseline of approximately `0.532`. This experiment does not show that the NCF model generalizes to unseen interactions. The live model will also need future-outcome evaluation on consented real use before its effectiveness can be claimed.

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

The admin evaluation endpoint calculates Precision@5, Recall@5, NDCG@10, and Mean Reciprocal Rank (MRR) for content-only, collaborative-only, and fallback hybrid rankings. It also displays the live adaptive model's labeled example count and ranking influence. In plain language:

- **Precision@5:** of the first five profiles shown, what fraction meet the evaluation's relevance rule?
- **Recall@5:** of all profiles that meet that rule, what fraction appear in the first five?
- **NDCG@10:** are relevant profiles near the top of the first ten, where higher positions count more?
- **MRR:** how high in the list does the first relevant profile appear, on average?

For this prototype, a profile is marked “relevant” if it shares at least two skills with the member **or** has an accepted connection with them. Metrics are averaged across evaluated members who have at least one profile meeting that rule. This is a designed proxy label, not a real person's judgment. It also reuses skills, which are inputs to content scoring. Therefore these dashboard metrics are useful for checking how ranking methods behave against the rule, but they are not independent proof that recommendations are useful, fair, or accurate in practice. There is no user acceptance study included in the repository.

The live adaptive model does not yet have an independent held-out evaluation report. Its training count and influence describe operation, not accuracy. The NCF notebook is evaluated separately on a held-out split of labeled synthetic request rows. Its classification metrics and the admin endpoint's proxy ranking metrics answer different questions; do not compare them as if they measured the same task.

Key limitations to keep in mind:

1. **Fabricated data:** the included names, profiles, and interactions are synthetic demonstration records. They are not evidence of performance on Kenya Airways stakeholders.
2. **Sparse collaboration signal:** the NCF input contains 372 accepted/declined examples, and every sender-recipient pair occurs only once. That leaves the model with little repeated pair history from which to learn preferences.
3. **Prototype relevance labels:** the admin benchmark defines relevance from shared skills and existing accepted links rather than independent human judgments.
4. **Cold-start settings:** the live model's minimum sample counts and gradual transition are hand-set prototype values, not optimized or validated on a large real dataset.
5. **Unvalidated live model:** the adaptive model learns from new outcomes, but the repository does not yet report a time-based test showing that it improves recommendation quality.
6. **Separate NCF experiment:** the Colab neural model and exported embeddings remain research artifacts. `/api/recommendations` uses the live logistic-regression model described above.

To evaluate real recommendation quality, the project needs consented real usage data, a time-aware or otherwise leakage-resistant evaluation split, relevance judgments from members, baseline comparisons, and a user study. Until then, present the current metrics as prototype diagnostics.

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

`NEXTAUTH_SECRET` is needed for signed sessions. `APP_URL` (or `NEXTAUTH_URL`) is used to create email links. Google OAuth and Gmail SMTP are optional integrations; configure `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GMAIL_USER`, and `GMAIL_APP_PASSWORD` if you want Google sign-in and email delivery. Use a Google App Password for `strathtank@gmail.com`, not the mailbox's normal password.

Administrators can invite another administrator from **Admin Console → Administrator Access** using the email address on that person's Google account. The recipient must open the one-time email link and set a password before elevated access activates; after activation they can sign in with that password or Google using the same email. Invitations expire after 24 hours and can be revoked or resent from the panel. Invitation and verification emails use Gmail SMTP; set `GMAIL_USER`, `GMAIL_APP_PASSWORD`, and a valid public `APP_URL` or `NEXTAUTH_URL` in the deployed environment. The final active administrator cannot remove their own access or remove the last other administrator.

The Admin Console **Audit Log** records member and administrator sign-ins and key actions across profiles, connection and mentorship requests, messages, events, opportunities, feedback, Flight Reconnect, and account governance. Each entry names the actor and, when relevant, the affected account. Audit records use the existing `AdminAction` table and need no schema migration.

### 3. Create tables and load the demonstration data

```bash
npm run db:push
npm run seed
```

`db:push` applies the Prisma schema to the configured database. `seed` creates the fabricated stakeholder accounts, profiles, skills, interests, requests, and feedback, and saves synthetic numeric feature snapshots on the requests. This gives a fresh demo database resolved examples for the adaptive recommender. The dataset is fabricated and its model scores are for demonstrating the workflow, not evidence of real-world accuracy. Seed demo accounts use the shared password `Test1234!`; use them only in a separate demo database and never reuse that password for a real service. Do not point these commands at the production database.

For a hosted demo, create a **new, empty PostgreSQL database/project** (do not clone production data). In PowerShell, apply the schema and load the fabricated dataset into that database:

```powershell
$env:DATABASE_URL = "<new-demo-database-connection-string>"
npm run db:push
npm run seed
Remove-Item Env:DATABASE_URL
```

Then add that same `DATABASE_URL` in Vercel with the **Preview** environment selected, leaving Production unchanged. Also make the preview's `NEXTAUTH_SECRET`, `ML_SERVICE_URL`, and `ML_SERVICE_TOKEN` available in the Preview environment if you want to sign in and test the hosted recommender there. Push or redeploy a non-production branch to create a Preview deployment using the demo database. For local setup, use the same PowerShell commands and start the app with `npm run dev`; neither setup changes Vercel Production.

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
npm run start      # Serve a previously built app
```

## Data model and privacy

The database separates accounts from stakeholder profiles. Profiles link to skills and interests through join tables. Mentorship and connection requests store six numeric compatibility features captured at send time; once resolved, those features and the accept/decline outcome provide examples for the adaptive recommender. Members should be told clearly that request outcomes help improve recommendations. Opportunities, events, event participation, and flight reconnect records support the other modules. The complete schema is [`prisma/schema.prisma`](prisma/schema.prisma).

Registration and sign-in are authenticated flows. Public profile visibility, verification, and suspension affect eligibility. Flight Reconnect requires consent from both people before a match is exposed. This is a research prototype, so it should not be used to store real passenger itineraries or other sensitive operational data without an appropriate privacy and security review.

## Documentation guide

- [Machine-learning model report](docs/ML_MODEL.md): NCF design, experiment, measured results, and limitations.
- [ML notebook instructions](ml/README.md): run the experiment in Colab and understand its outputs.
- [Data guide](docs/DATA.md): source, shape, synthetic nature, and seeding behavior of the CSV files.
- [AI development disclosure](docs/AI_USAGE.md): how AI tools were used during development.
- [Project roadmap](docs/ROADMAP.md): current implementation status and remaining work.

## Academic information

- **Project:** Intelligent Stakeholder Matching for Mentorship and Professional Networking Using Hybrid Recommendation Techniques: A Case of Kenya Airways
- **Author:** Kamau Edwin Kamau (Admission No. 152803)
- **Course:** Informatics and Computer Sciences, ICS 4 Group B
- **Institution:** Strathmore University, Nairobi, Kenya
- **Supervisor:** Madam Julliet Kirui
- **Prototype date:** June 2026

## Disclaimer and license

This is an academic capstone prototype, not an officially deployed Kenya Airways product. Kenya Airways names and marks belong to their respective owners. The project is distributed under the MIT License; see [`LICENSE`](LICENSE).
