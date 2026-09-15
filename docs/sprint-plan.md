# Sprint Plan — Intelligent Stakeholder Matching Platform

**Project:** Intelligent Stakeholder Matching for Mentorship and Professional Networking (Kenya Airways)
**Student:** Kamau Edwin Kamau — 152803
**Methodology:** Agile (Sprint Planning → Sprint Development → Sprint Review), one module per sprint, weekly cycles

> For current task-level status and sequencing, see [`ROADMAP.md`](ROADMAP.md) — it's reconciled against the GitHub issue tracker and kept up to date; this file is the higher-level narrative.

---

## Completed Sprints 

| Sprint | Dates | Goal | Delivered | Status |
|---|---|---|---|---|
| Sprint 0 | 17 Aug | Project setup | Next.js scaffold, Prisma schema, first migration, repo initialized | ✅ Done |
| Sprint 1 | 18–25 Aug | Authentication foundation | NextAuth integration, register/login pages, Prisma client wiring | ✅ Done |
| Sprint 2 | 26 Aug – 8 Sep | Account verification | Resend email verification on registration, login gated on verified accounts | ✅ Done |
| Sprint 3 | 9–13 Sep | Profiles & seed data | Profile management page, nav component, database seeding script, config updates | ✅ Done |
| Sprint 4 | 9–15 Sep | Recommendation Engine: Content-Based Filtering | Weighted Jaccard similarity over skills/interests (`src/lib/recommendation.js`), `/api/recommendations`, `/recommendations` page | ✅ Done (landed alongside Sprint 3, ahead of the original 14–20 Sep estimate) |

**Correction:** Sprint 3's "profiles" delivery did not include a working member
directory, despite GitHub issue #2 having been marked closed — `Nav.js` links
to `/directory` but no such page or listing API exists. Reopened as #2; see
[`ROADMAP.md`](ROADMAP.md).

---

## Upcoming Sprints

### Sprint 5 — Member Directory + Recommendation Engine: Collaborative Filtering + Hybrid Score (16–27 Sep)
- Build the member directory: a page listing public profiles with search/filter by role, skill, or interest (#2)
- Implement CF scoring from accepted connections / mentorship interactions
- Combine CBF + CF using the weighted hybrid formula (Hybrid = α·CBF + β·CF) from the proposal
- Build the recommendations UI page showing ranked matches
- Log α/β values and rationale for early-stage weighting (cold-start handling)

### Sprint 6 — Mentorship & Connection Workflow (28 Sep – 4 Oct)
- `MentorshipRequest` and `ConnectionRequest` models already in schema — build the API routes and UI: send, accept, decline
- Notification or status indicator for pending requests
- Interaction logging feed back into the CF model

### Sprint 7 — Opportunity & Event Hub (5–11 Oct)
- CRUD for `Opportunity` and `Event` models
- Posting/browsing UI for career openings, internships, workshops, reunions
- `EventParticipant` RSVP flow

### Sprint 8 — Flight Reconnect Module (12–18 Oct)
- Consent-based opt-in flow using the `FlightReconnect` model
- Matching by shared route/date, restricted to verified users
- Privacy review: confirm data minimization and opt-in-only visibility

### Sprint 9 — Admin & Moderation Portal (19–25 Oct)
- Role-based access control for admin routes
- Credential/role verification screen, `AdminAction` audit logging
- Feedback and moderation dashboard

### Sprint 10 — Evaluation & UAT (26 Oct – 1 Nov)
- Implement Precision@K, Recall@K, F1, NDCG scoring against seed/test data
- Run User Acceptance Testing with a small stakeholder group
- Document results against the Evaluation Framework in your proposal

### Sprint 11 — Polish, Testing, Documentation (2–8 Nov)
- Bug fixes, responsive/UI polish, edge-case testing
- Update README and system architecture diagrams to match final build
- Final report writeup and demo prep
