# PrideConnect: Intelligent Stakeholder Matching

PrideConnect is a student-built web application that helps members of the Kenya Airways community discover mentors and professional peers. A member creates a profile with their skills and interests. The application compares that profile with other eligible profiles, uses accepted connections as an additional signal, and presents a ranked list of possible matches.

> **Project status:** Academic prototype for the Strathmore University capstone. It is not an official Kenya Airways service. The included people and interaction history are fabricated demonstration data, not real Kenya Airways records.

## Start here

This repository contains both a working web application and a separate machine-learning experiment. The distinction matters:

| Part | What it does | Is it used by the live website? |
|---|---|---|
| Live hybrid recommender | Uses profile overlap and accepted connections to rank possible matches. | Yes. |
| Neural Collaborative Filtering (NCF) experiment | Trains a small neural network to predict whether an existing request will be accepted. | No. It is a separate research notebook. |
| Admin evaluation | Compares live ranking formulas against a rule-based definition of a “relevant” profile. | Admin-only diagnostic; it is not an independent user study or held-out validation. |

In simple terms, the live recommender is a set of transparent formulas. The notebook contains the project's trained neural network. The network did not perform better than a simple baseline on the available synthetic data, so it is not connected to live recommendations. Read [How matching works](#how-matching-works), [Machine-learning experiment](#machine-learning-experiment), and [Evaluation and limitations](#evaluation-and-limitations) for the details.

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

The live application builds a ranked list for the signed-in member. It does not train itself when someone clicks a recommendation. It calculates scores using the profile and accepted-interaction data currently stored in the database.

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

### 3. Combine both scores

The final score is a weighted average:

```text
hybrid score = (alpha × content score) + (beta × collaborative score)
alpha + beta = 1
```

The current implementation starts with 90% content and 10% collaborative weighting. As the total number of accepted mentorship and connection requests grows, it shifts linearly toward 50% / 50%. The shift reaches 50% / 50% at 50 accepted request records and stays there. These are prototype settings in `src/lib/hybrid.js`, not learned parameters or values established by a real-world experiment.

Eligible candidates are public, verified, non-suspended profiles other than the current member. The live endpoint stores the current component scores and returns up to 12 candidates ordered by hybrid score. The UI may apply additional filters when displaying them.

### A worked example

Suppose the profile score is `0.70` and the connection-pattern score is `0.20`. With 90% / 10% weights:

```text
hybrid score = (0.90 × 0.70) + (0.10 × 0.20)
             = 0.63 + 0.02
             = 0.65 (65%)
```

The percentage is a ranking score, **not** a 65% probability that a request will be accepted.

The code implementing the live method is in [`src/lib/recommendation.js`](src/lib/recommendation.js), [`src/lib/collaborative.js`](src/lib/collaborative.js), and [`src/lib/hybrid.js`](src/lib/hybrid.js). The authenticated endpoint is [`src/app/api/recommendations/route.js`](src/app/api/recommendations/route.js).

## Machine-learning experiment

The project also includes a separately trained Neural Collaborative Filtering (NCF) model in [`ml/train_recommender.ipynb`](ml/train_recommender.ipynb). It asks a different question from the live recommender: **given a request between two known stakeholders, can a model predict whether that request was accepted or declined?**

It uses the sender, recipient, and request type (mentorship or connection) as inputs. Learned user embeddings represent each stakeholder as a short list of numbers; a small neural network combines the two people’s embeddings and request type and outputs a predicted acceptance score. The experiment uses a train/validation/test split, binary cross-entropy loss, Adam optimization, regularization, and early stopping. This is the repository's trained model; the live formula-based recommender has no training step.

The reported test ROC-AUC is approximately `0.498`, close to random ranking (`0.5`). Test accuracy is `0.52`, below the majority-class baseline of approximately `0.532`. This is a negative result: the current experiment does not show that the model can generalize to unseen interactions. It is documented rather than hidden. Because the data is synthetic, small, and sparse, this result should not be interpreted as evidence about real members or future production performance.

The notebook, its limitations, the exported artifacts, and instructions to rerun it in Google Colab are explained in [`docs/ML_MODEL.md`](docs/ML_MODEL.md) and [`ml/README.md`](ml/README.md).

## Evaluation and limitations

The admin evaluation endpoint calculates Precision@5, Recall@5, NDCG@10, and Mean Reciprocal Rank (MRR) for the content-only, collaborative-only, and hybrid rankings. In plain language:

- **Precision@5:** of the first five profiles shown, what fraction meet the evaluation's relevance rule?
- **Recall@5:** of all profiles that meet that rule, what fraction appear in the first five?
- **NDCG@10:** are relevant profiles near the top of the first ten, where higher positions count more?
- **MRR:** how high in the list does the first relevant profile appear, on average?

For this prototype, a profile is marked “relevant” if it shares at least two skills with the member **or** has an accepted connection with them. Metrics are averaged across evaluated members who have at least one profile meeting that rule. This is a designed proxy label, not a real person's judgment. It also reuses skills, which are inputs to content scoring. Therefore these dashboard metrics are useful for checking how ranking methods behave against the rule, but they are not independent proof that recommendations are useful, fair, or accurate in practice. There is no user acceptance study included in the repository.

The NCF notebook is evaluated separately on a held-out split of labeled synthetic request rows. Its classification metrics and its ranking metric answer different questions from the admin endpoint's ranking metrics; do not compare them as if they measured the same task.

Key limitations to keep in mind:

1. **Fabricated data:** the included names, profiles, and interactions are synthetic demonstration records. They are not evidence of performance on Kenya Airways stakeholders.
2. **Sparse collaboration signal:** the NCF input contains 372 accepted/declined examples, and every sender-recipient pair occurs only once. That leaves the model with little repeated pair history from which to learn preferences.
3. **Prototype relevance labels:** the admin benchmark defines relevance from shared skills and existing accepted links rather than independent human judgments.
4. **Fixed design choices:** the 60/40 profile split and the 50-interaction weight schedule are hand-set prototype values, not optimized or validated on a large real dataset.
5. **No live NCF inference:** the Colab model and exported embeddings are research artifacts. `/api/recommendations` uses the transparent JavaScript formulas described above.

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

Separate offline experiment:
CSV demonstration data → Google Colab / PyTorch NCF → evaluation artifacts
                                          (not connected to the live API)
```

- **Web application:** Next.js 16 App Router and React 19, written primarily in JavaScript.
- **Authentication:** NextAuth credentials and optional Google OAuth.
- **Database:** PostgreSQL accessed through Prisma.
- **Training experiment:** Python notebook using PyTorch, pandas, NumPy, scikit-learn, and matplotlib in Google Colab.

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

`NEXTAUTH_SECRET` is needed for signed sessions. `APP_URL` is used to create verification links. Google OAuth and Resend are optional integrations; configure their credentials in `.env` if you want Google sign-in and email verification delivery. Check [`src/lib/auth.js`](src/lib/auth.js) and [`src/lib/resend.js`](src/lib/resend.js) for their behavior.

### 3. Create tables and load the demonstration data

```bash
npm run db:push
npm run seed
```

`db:push` applies the Prisma schema to the configured database. `seed` creates the fabricated stakeholder accounts, profiles, skills, interests, requests, and feedback. Seed demo accounts use the shared password `Test1234!`; use them only in a local demonstration database and never reuse that password for a real service.

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

The database separates accounts from stakeholder profiles. Profiles link to skills and interests through join tables. Mentorship requests, connection requests, and feedback record network activity; opportunities, events, event participation, and flight reconnect records support the other modules. The complete schema is [`prisma/schema.prisma`](prisma/schema.prisma).

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
