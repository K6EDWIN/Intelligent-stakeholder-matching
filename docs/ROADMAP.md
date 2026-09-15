# Roadmap

This reconciles the two planning docs that had drifted apart: the GitHub issue
tracker's day-by-day plan (issues, `week-1`/`week-2`/`week-3` labels) and
[`sprint-plan.md`](sprint-plan.md)'s weekly-sprint table. The issue tracker is
the source of truth for task-level status going forward — this file is the
narrative version, kept in sync with it. Last reconciled: 2026-09-16.

## Where the project actually is right now

Verified against the code, not just against what issues say:

| Feature | Status | Evidence |
|---|---|---|
| Auth (register/login, email verification) | ✅ Done | `src/lib/auth.js`, `src/app/api/auth/`, `src/app/api/register/` |
| Profile management (create/edit own profile) | ✅ Done | `src/app/profile/`, `src/app/api/profile/` — closes #1 |
| Synthetic seed dataset (skills/interests/users) | ✅ Done | `prisma/seed.cjs`, documented in [`DATA.md`](DATA.md) |
| Content-based filtering recommendations | ✅ Done | `src/lib/recommendation.js`, `/api/recommendations`, `/recommendations` page — closes #3 |
| **Member directory** | ❌ **Not actually built** | Nav links to `/directory`; no such route or listing API exists. #2 was closed prematurely — reopened |
| Mentorship/connection requests | ⬜ Not started | #5 |
| Collaborative filtering, hybrid scoring | ⬜ Not started | #7, #8 |
| Opportunity/Event/Flight Reconnect/Admin | ⬜ Not started | #9, #20, #10, #21 |
| Evaluation metrics, UAT, deployment | ⬜ Not started | #11, #12, #22 |

The one correction worth flagging: **the member directory (#2) was marked
closed but isn't implemented** — `/api/profile` only ever returns the logged-in
user's own profile, there's no endpoint that lists/searches public profiles,
and `src/app/directory/` doesn't exist. Reopened; see below.

## Milestones

Three GitHub milestones group the remaining issues:

### [Interactions & Recommendation Engine](https://github.com/K6EDWIN/Intelligent-stakeholder-matching/milestone/1) — due ~Oct 3
The immediate next phase — this is what collaborative filtering and hybrid
scoring depend on, so it goes first:
- #2 — Member directory (browse/search/filter public profiles) — **do this
  first**, it unblocks realistic manual testing of everything after it
- #4 — Buffer/catch-up for the above
- #5 — Mentorship & connection request send/accept/decline flow
- #6 — Simulated interaction history (seed realistic requests/acceptances/feedback)
- #7 — Collaborative filtering over interaction data
- #8 — Hybrid scoring (combine content + collaborative scores)

### [Supporting Modules](https://github.com/K6EDWIN/Intelligent-stakeholder-matching/milestone/2) — due ~Oct 17
Not the core contribution — keep these simple:
- #9 — Opportunity board (CRUD)
- #20 — Event management + RSVP
- #10 — Flight Reconnect module
- #21 — Admin & moderation dashboard

### [Evaluation & Launch](https://github.com/K6EDWIN/Intelligent-stakeholder-matching/milestone/3) — due ~Nov 7
- #11 — Precision@K/Recall@K/F1/NDCG evaluation against seed/simulated data
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
