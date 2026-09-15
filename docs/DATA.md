# Data

## What data exists

All data for local development and demos comes from [`prisma/seed.cjs`](../prisma/seed.cjs), which loads three things:

1. **Skills** — a reference list of 20 skill tags (e.g. `Leadership`, `Flight Operations`, `Cybersecurity`), stored in the `Skill` model.
2. **Interests** — a reference list of 15 interest tags (e.g. `Career Development`, `Aviation Industry Trends`), stored in the `Interest` model.
3. **Test stakeholders** — 10 fabricated `User` + `Profile` records spanning every `UserRole` (`STAFF`, `ALUMNI`, `FORMER_STAFF`, `FREQUENT_FLYER`), each with a name, department, bio, mentorship role/availability, and a handful of skills/interests linked via `ProfileSkill`/`ProfileInterest`. All are pre-verified (`isVerified: true`) so they're usable immediately without clicking an email link, and all share the password `Test1234!`.

## Why it's synthetic

No real Kenya Airways organizational data is available or appropriate for a student capstone project. Using fabricated stakeholders is a deliberate design choice, not a gap — it follows the same data-minimization principle the README's "Privacy, Security, and Ethical Considerations" section states for the product itself: real names, emails, skills, and travel data belonging to real people should never end up in a student project's database or git history. The synthetic dataset is realistic enough (varied roles, departments, skills, interests) to exercise search, filtering, directory listing, and the content-based recommendation engine end-to-end.

## Schema it populates

See [`prisma/schema.prisma`](../prisma/schema.prisma) for the full data model. The seed script touches:
- `Skill`, `Interest` — the reference lists above.
- `User`, `Profile` — one of each per test stakeholder.
- `ProfileSkill`, `ProfileInterest` — join tables linking a profile to its skills/interests.

It does not seed `MentorshipRequest`, `ConnectionRequest`, `Recommendation`, `Feedback`, `Opportunity`, `Event`, or `FlightReconnect` rows — those are created through normal app usage (or will be, as collaborative-filtering and interaction-history work lands).

## How to regenerate or extend it

- Add entries to the `skills` or `interests` arrays, or new objects to `testUsers`, in `prisma/seed.cjs`.
- Re-run it with `npm run seed` (wraps `node prisma/seed.cjs`). Every write uses `upsert`/`skipDuplicates`, so re-running is safe and idempotent — it won't create duplicate skills, interests, or users on repeated runs.

## Schema versioning

`prisma/migrations/` is the source of truth for how the schema has evolved — not manual database edits. Any schema change should go through `npx prisma migrate dev` so it's captured as a migration file and applied consistently across environments (see [Getting Started](../README.md#getting-started) in the README).

## Follow-up (not in scope now)

The README's evaluation framework calls for Precision@K, Recall@K, and NDCG metrics once the recommendation engine has real interaction data to evaluate against. That requires either a larger synthetic interaction-history dataset (planned alongside the collaborative-filtering work) or a real evaluation dataset — deliberately deferred rather than bolted on under Sprint 1 pressure.
