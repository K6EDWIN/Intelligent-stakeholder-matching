# AI Usage Across the Development Pipeline

This documents how AI assistance was actually used in this project, stage by
stage, following the standard dataset → prep → local dev → version control →
training → deployment pipeline shape.

One distinction worth stating up front: the **live app's** recommendation
engine (`src/lib/recommendation.js`, `collaborative.js`, `hybrid.js`) is
still entirely hand-specified similarity/weighting math — no training loop,
no weights, nothing learned. But there is now a genuinely **trained** model
in this project too: [`ml/train_recommender.ipynb`](../ml/train_recommender.ipynb),
a Colab-trained Neural Collaborative Filtering model, kept deliberately
separate from the live app (see [`ML_MODEL.md`](ML_MODEL.md) for what it is,
why it's separate, and what it found). So the pipeline below includes a real
Colab/GPU-training/GDrive-checkpoint stage — it's just scoped to that one
standalone research artifact, not to the product itself.

## The actual flow

```
Dataset & Prep → Local (dev) → GitHub → Colab (training) → Testing → Deployment (Vercel)
                                              ↕
                                        GDrive (checkpoints)
```

## Where AI tools fit at each stage

### 1. Dataset & prep
`prisma/data/stakeholders.csv` (150 stakeholders) and `interactions.csv` (441
interactions) were generated, then imported into `prisma/seed.cjs` with
Claude Code — including writing the CSV-driven seeding logic, deriving the
Skill/Interest reference lists from the data itself instead of a
hand-maintained list, and a full dry-run validation of the parsing/lookup
logic against the real files before it ever touched a database (documented in
[`DATA.md`](DATA.md)).

### 2. Local development
Every feature in this repo past the initial scaffold — authentication,
profile management, the member directory, mentorship/connection requests,
content-based/collaborative/hybrid recommendation scoring, opportunities,
events, Flight Reconnect, and the admin dashboard — was implemented with
Claude Code, including the local dev environment setup itself
(`.env.example`, `docker-compose.yml`, `.nvmrc`, the `postinstall: prisma
generate` step).

### 3. GitHub (version control)
Claude Code wrote every commit message, PR description, and the CI workflow
(`.github/workflows/ci.yml`) in this repo's history, and drove the
`feature/* → develop → main` merge flow end to end via `gh`. It also
reconciled the GitHub issue tracker against actual code state (closing
issues that were done, reopening one that had been closed without being
built, splitting overloaded issues, adding milestones) — see
[`ROADMAP.md`](ROADMAP.md).

One gap worth naming honestly: commits in this repo do **not** carry a
`Co-Authored-By` trailer identifying AI involvement, despite that being
standard practice — this was missed for the bulk of this project's history
and is being corrected going forward rather than rewritten into already
-merged branches. The PR descriptions are the more complete record: each one
states what changed, why, and how it was verified.

### 4. Colab (training)
Claude Code wrote the full training notebook (`ml/train_recommender.ipynb`)
— data loading, the NCF model definition, the training loop with GDrive
checkpointing, evaluation, and plotting — and then actually **ran it**
locally (CPU, no GPU available in that sandbox) against the real
`prisma/data/*.csv` files before ever assembling it into notebook form, to
confirm the code was correct rather than shipping untested training code.
That run surfaced a real finding (every interaction pair in the dataset
occurs exactly once, so the model can't beat random guessing) that's
reported honestly in `ML_MODEL.md` rather than hidden or hand-waved past.
Colab-specific pieces it can't execute itself (Drive mounting, GPU
allocation) are written correctly per Colab's documented API but rely on
the student's own Colab run to exercise for real.

### 5. Testing
Claude Code wrote and ran `npm run lint` / `npm run build` before every PR,
plus browser-based smoke tests (auth-redirect checks) where a live database
wasn't available in its sandboxed environment. For changes involving a
database migration or the seed script itself, it explicitly flagged that it
could not verify against a live database and asked for a manual pass —
the student then ran the actual migration/seed/click-through locally and
reported results back before those PRs were merged. That division of labor
(AI for what's mechanically checkable, human for what requires a real
environment) is deliberate, not a limitation to hide.

### 6. Deployment
Not yet done ([#22](https://github.com/K6EDWIN/Intelligent-stakeholder-matching/issues/22)).
When it happens: Vercel (frontend/API) + a managed Postgres (Neon/Supabase/
Railway), not the AWS/Azure/GCP/HuggingFace stack a trained-model project
would need — this is a Next.js + PostgreSQL app with no GPU workload. AI
assistance at that stage would look like config debugging and environment
variable setup, same as every other stage: development acceleration, not the
product itself.

## The framing this section exists to support

AI assistance here is a development accelerant across the pipeline — used
for scripting, debugging, documentation, CI/CD configuration, repo hygiene,
and (for the one place a real model exists) writing and running the
training/evaluation code — not as a black box standing in for the work
itself. The **live** content-based, collaborative, and hybrid scoring
functions are hand-specified similarity/weighting formulas (see the doc
comments in [`recommendation.js`](../src/lib/recommendation.js),
[`collaborative.js`](../src/lib/collaborative.js), and
[`hybrid.js`](../src/lib/hybrid.js)) that no training touched. The one
trained model in the project (`ml/train_recommender.ipynb`) was built,
run, and evaluated by Claude Code, with its honestly-reported result kept
deliberately out of the live serving path — see [`ML_MODEL.md`](ML_MODEL.md).
That's the same distinction the original pipeline sketch draws between "AI
as tooling" and "AI as the thing being evaluated" — it just applies here to
Claude Code rather than ChatGPT, since Claude Code is what actually has an
auditable trail (PR descriptions, this repo's commit history) of doing the
work, and ChatGPT or other tools may separately have been used by the
student for planning, brainstorming, or report drafting outside the
codebase itself.
