# Roadmap

This reconciles the two planning docs that had drifted apart: the GitHub issue
tracker's day-by-day plan (issues, `week-1`/`week-2`/`week-3` labels) and
[`sprint-plan.md`](sprint-plan.md)'s weekly-sprint table. The issue tracker is
the source of truth for task-level status going forward — this file is the
narrative version, kept in sync with it. Last reconciled: 2026-09-21.

## Where the project actually is right now

Verified against the code, not just against what issues say:

| Feature | Status | Evidence |
|---|---|---|
| Auth (register/login, email verification) | ✅ Done | `src/lib/auth.js`, `src/app/api/auth/`, `src/app/api/register/` |
| Profile management (create/edit own profile) | ✅ Done | `src/app/profile/`, `src/app/api/profile/` — closes #1 |
| Synthetic seed dataset (150 stakeholders, 441 interactions) | ✅ Done | `prisma/seed.cjs`, `prisma/data/*.csv`, documented in [`DATA.md`](DATA.md) |
| Member directory | ✅ Done | `src/app/directory/`, `/api/directory` — closes #2 |
| Content-based filtering recommendations | ✅ Done | `src/lib/recommendation.js`, `/api/recommendations` — closes #3 |
| Mentorship/connection requests | ✅ Done | `/api/mentorship-requests`, `/api/connection-requests`, `/requests` — closes #5 |
| Collaborative filtering, hybrid scoring | ✅ Done | `src/lib/collaborative.js`, `src/lib/hybrid.js` — closes #7, #8 |
| Opportunity board, Events + RSVP | ✅ Done | `/api/opportunities`, `/api/events` — closes #9, #20 |
| Flight Reconnect | ✅ Done | `/api/flight-reconnect`, mutual opt-in matching — closes #10 |
| Admin & moderation dashboard | ✅ Done | `/admin`, `User.isSuspended` migration — closes #21. Manually verified against a live DB before merging |
| Trained NCF model (accept/decline prediction) | ✅ Done | `ml/train_recommender.ipynb`, [`ML_MODEL.md`](ML_MODEL.md) — closes #46. Standalone research artifact, not wired into live ranking |
| Admin ranking diagnostics | ✅ Implemented, proxy labels only | `/api/admin/evaluation`; not an independent measure of recommendation relevance |
| Independent evaluation, UAT, deployment | ⬜ Not started | #11 (real or human-judged validation), #12, #22 |

## Milestones

### [Interactions & Recommendation Engine](https://github.com/K6EDWIN/Intelligent-stakeholder-matching/milestone/1) — ✅ complete
#2, #4, #5, #6, #7, #8 all closed.

### [Supporting Modules](https://github.com/K6EDWIN/Intelligent-stakeholder-matching/milestone/2) — ✅ complete
#9, #20, #10, #21 all closed.

### [Evaluation & Launch](https://github.com/K6EDWIN/Intelligent-stakeholder-matching/milestone/3) — due ~Nov 7
- #11 — Precision@K/Recall@K/F1/NDCG evaluation against seed/simulated data.
  The trained model's ranking-evaluation cell (`ml/train_recommender.ipynb`)
  is a working template for this.
- #46 — ✅ Done. Trained NCF model for accept/decline prediction — see
  [`ML_MODEL.md`](ML_MODEL.md). Finding: doesn't beat the majority-class
  baseline on the synthetic dataset. Every sender-recipient pair occurs once;
  the result does not independently validate the separate live hybrid
  recommendation formula.
- #12 — UAT and bug fixing
- #22 — Deploy to Vercel + managed Postgres (needed to actually run UAT with others)
- #13 — Buffer, final documentation, report writeup, demo prep

## Sequencing rationale

1. **Member directory before mentorship requests.** You can't meaningfully
   send a mentorship/connection request to someone you can't find. #2 blocks #5.
2. **Interaction history before collaborative filtering.** CF needs data to
   collaborate over — #6 (even simulated) blocks #7.
3. **Hybrid scoring last in that group**, since it's just combining #3
   (already done) with #7's output.
4. **Supporting modules are parallelizable** with each other but not urgent —
   they're explicitly "supporting," not core contribution, per the proposal.
5. **Deploy before UAT**, not after — UAT with a "small stakeholder group"
   (#12) needs a URL people other than you can open.

## Note on the two timelines

`sprint-plan.md`'s weekly-sprint table dates Sprint 4 (content-based
filtering) as 14–20 Sep; it actually landed earlier, alongside Sprint 3's
profile work. The day-based issue tracker's pacing (21 working days total) is
the more aggressive and more current plan — treat it as authoritative for
sequencing and `sprint-plan.md` as the higher-level narrative, updated to
match.
