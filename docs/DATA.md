# Data

## What data exists

All data for local development, demos, and evaluation comes from two CSV files in [`prisma/data/`](../prisma/data/), loaded by [`prisma/seed.cjs`](../prisma/seed.cjs):

1. **`stakeholders.csv`** — 150 fabricated stakeholders spanning every `UserRole` (`STAFF`, `ALUMNI`, `FORMER_STAFF`, `FREQUENT_FLYER`), each with a name, department, bio, mentorship role/availability, and skills/interests. Seeded as `User` + `Profile` (+ `ProfileSkill`/`ProfileInterest` links). All are pre-verified (`isVerified: true`) so they're usable immediately without clicking an email link, and all share the password `Test1234!`. The `Skill`/`Interest` reference lists themselves are *derived* from this file (every unique value used across all 150 rows), not maintained separately — one source of truth, no risk of the two drifting apart.
2. **`interactions.csv`** — 441 simulated `MentorshipRequest`/`ConnectionRequest` records between pairs of those stakeholders (208 mentorship, 233 connection): 198 `ACCEPTED`, 174 `DECLINED`, and 69 `PENDING`. The 198 accepted rows carry a 1–5 rating, seeded as `Feedback`. The live collaborative score uses accepted records. The admin endpoint also reports ranking diagnostics using a proxy relevance rule; those diagnostics are not an independent evaluation against human judgments. See [`ML_MODEL.md`](ML_MODEL.md) for the separate NCF experiment and its held-out interaction results.

A much smaller hand-written version of this (10 users, 12 interactions) shipped first. The current CSVs make it easier to exercise the application, but the data remains sparse for machine learning: each labeled sender-recipient pair occurs once. Do not treat its size or synthetic patterns as evidence of real-world recommendation quality.

3. **`admin@example.com`** — one seeded `UserRole.ADMIN` account (password `Test1234!`, same as everyone else), created directly in `prisma/seed.cjs` rather than the CSV. None of the 150 CSV rows use the `ADMIN` role — real KQ admins aren't part of the synthetic stakeholder dataset — so without this there'd be no account able to log in and test `/admin`.

## Why it's synthetic

No real Kenya Airways organizational data is available or appropriate for a student capstone project. Using fabricated stakeholders is a deliberate design choice, not a gap — it follows the same data-minimization principle the README's "Privacy, Security, and Ethical Considerations" section states for the product itself: real names, emails, skills, and travel data belonging to real people should never end up in a student project's database or git history. The synthetic dataset is realistic enough (varied roles, departments, skills, interests) to exercise search, filtering, directory listing, and the content-based recommendation engine end-to-end.

## Schema it populates

See [`prisma/schema.prisma`](../prisma/schema.prisma) for the full data model. The seed script touches:
- `Skill`, `Interest` — derived from `stakeholders.csv`.
- `User`, `Profile` — one of each per stakeholder row.
- `ProfileSkill`, `ProfileInterest` — join tables linking a profile to its skills/interests.
- `MentorshipRequest`, `ConnectionRequest` — from `interactions.csv`.
- `Feedback` — ratings on `ACCEPTED` rows, linked via `mentorshipRequestId` or the newer `connectionRequestId` (see below).

It does not seed `Recommendation` (computed live by `/api/recommendations`, see [`src/lib/recommendation.js`](../src/lib/recommendation.js)), `Opportunity`, `Event`, or `FlightReconnect` rows. Those features exist in the application, but are empty until created through the app or separately populated.

**Schema changes that came out of building against this data:**
- `Feedback` could previously only attach to a `MentorshipRequest`. Over half of `interactions.csv`'s rated rows (104 of 198) are accepted *connections*, which had nowhere to go under the old schema. Added `Feedback.connectionRequestId` (nullable, same pattern as `mentorshipRequestId`) via migration `20260916120000_add_connection_request_feedback` rather than silently dropping that half of the data.
- `User` had no way to represent a suspended account, needed for the admin dashboard's moderation actions (#21). Added `User.isSuspended` (boolean, default `false`) via migration `20260921063000_add_user_is_suspended`. Login now rejects suspended users the same way it already rejects unverified ones (see `src/lib/auth.js`).

## How to regenerate or extend it

- Edit `prisma/data/stakeholders.csv` / `prisma/data/interactions.csv` directly, or replace them with a fresh export in the same shape (see the header row of each for the exact columns expected).
- Re-run with `npm run seed` (wraps `node prisma/seed.cjs`). Skills/interests/users use `upsert`/`skipDuplicates`; requests and feedback aren't backed by a unique constraint (a real user can legitimately send a second request after a decline), so the script checks for existing sender/receiver pairs up front instead. Either way, re-running is safe and idempotent — it won't create duplicates on repeated runs.
- `prisma/seed.cjs`'s CSV parser is intentionally minimal (handles the one quoted `bio` field these files use, not general CSV escaping) — if a replacement export contains an embedded literal quote character in any field, extend the parser or switch to a real CSV library first.

## Schema versioning

`prisma/migrations/` is the source of truth for how the schema has evolved — not manual database edits. Any schema change should go through `npx prisma migrate dev` so it's captured as a migration file and applied consistently across environments (see [Getting Started](../README.md#getting-started) in the README).

## Evaluation note

The admin endpoint computes Precision@5, Recall@5, NDCG@10, and MRR using a proxy relevance rule (at least two shared skills or an accepted relationship). Since shared skills also influence content scoring, this is not independent ground truth and must not be described as real-world validation. The NCF notebook evaluates acceptance predictions on a stratified random split of labeled request rows; those results are reported separately in [`ML_MODEL.md`](ML_MODEL.md).
