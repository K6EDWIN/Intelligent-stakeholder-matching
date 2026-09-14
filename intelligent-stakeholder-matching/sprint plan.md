# Sprint Plan — Intelligent Stakeholder Matching Platform

**Project:** Intelligent Stakeholder Matching for Mentorship and Professional Networking (Kenya Airways)
**Student:** Kamau Edwin Kamau — 152803
**Methodology:** Agile (Sprint Planning → Sprint Development → Sprint Review), one module per sprint, weekly cycles

---

## Completed Sprints (from Git history)

| Sprint | Dates | Goal | Delivered | Status |
|---|---|---|---|---|
| Sprint 0 | 17 Aug | Project setup | Next.js scaffold, Prisma schema, first migration, repo initialized | ✅ Done |
| Sprint 1 | 18–25 Aug | Authentication foundation | NextAuth integration, register/login pages, Prisma client wiring | ✅ Done |
| Sprint 2 | 26 Aug – 8 Sep | Account verification | Resend email verification on registration, login gated on verified accounts | ✅ Done |
| Sprint 3 | 9–13 Sep | Profiles & seed data | Profile management page, nav component, database seeding script, config updates | ✅ Done |

---

## Upcoming Sprints

### Sprint 4 — Recommendation Engine: Content-Based Filtering (14–20 Sep)
- Extend `prisma/seed.cjs` with realistic skill/interest/interaction data so recommendations have something to score against — this doubles as your "dataset"
- Build a `src/lib/recommend/cbf.js` module: vector similarity over profile attributes (skills, department, interests)
- Add a `/api/recommendations` route that returns CBF-ranked matches for a given user
- Commit in small increments (setup → similarity function → API route → test data) so sprint progress is visible in Git

### Sprint 5 — Recommendation Engine: Collaborative Filtering + Hybrid Score (21–27 Sep)
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
