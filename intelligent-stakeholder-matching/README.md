# Intelligent Stakeholder Matching

A web-based hybrid recommendation platform for mentorship and professional
networking within a stakeholder community — alumni, current staff, former
employees, verified frequent flyers, and administrators. Built as a capstone
project for the Degree in Informatics and Computer Sciences, School of
Computing and Engineering Sciences, Strathmore University, using Kenya
Airways' Pride Centre community as the illustrative case.

The system combines **content-based filtering** (profile attribute
similarity: skills, interests, professional background) and **collaborative
filtering** (interaction patterns: mentorship requests, connections,
feedback) into a weighted hybrid recommendation score, to suggest relevant
mentors and professional connections to each stakeholder.

## Tech Stack

- **Framework:** Next.js (App Router, JavaScript, no TypeScript in app code)
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL
- **ORM:** Prisma 7 (with `@prisma/adapter-pg` driver adapter)
- **Auth:** NextAuth (Credentials provider, JWT sessions) with email
  verification via Resend
- **Diagrams:** Draw.io

## Getting Started

### 1. Prerequisites

- Node.js 20+
- A local or hosted PostgreSQL database
- A [Resend](https://resend.com) account (free tier) for verification emails

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root (see `.env.example` for the exact
shape):

```
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/kq_stakeholder_matching"
NEXTAUTH_SECRET="a-long-random-string"
RESEND_API_KEY="re_your_actual_key"
APP_URL="http://localhost:3000"
```

### 4. Set up the database

```bash
npx prisma migrate dev
npx prisma generate
npx prisma db seed
```

The seed script populates reference skills/interests and a set of fake
stakeholder profiles for testing the directory and recommendation engine
without needing real Kenya Airways data (which is restricted — see
Limitations in the project proposal).

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Register an account,
verify it via the emailed link, then log in.

## Project Structure

```
src/
  app/
    api/            API routes (auth, register, profile, directory, recommendations)
    login/           Login page
    register/        Registration page
    profile/          Profile completion/edit page
    directory/        Member directory with search/filter
    recommendations/  Ranked "Suggested for you" matches
  lib/
    auth.js            NextAuth configuration
    prisma.js           Prisma client (with driver adapter)
    resend.js           Resend client
    recommendation.js   Content-based filtering / similarity scoring
  components/
    Nav.js               Top navigation bar
prisma/
  schema.prisma      Database schema (14 tables)
  seed.cjs             Reference data + fake stakeholder seed script
```

## Core Modules

- **Authentication & User Management** — registration, login, and
  email verification (unverified accounts cannot log in)
- **Role-Based Profiles** — skills, interests, department, professional
  background, mentorship role/needs, availability
- **Member Directory** — search and filter stakeholders by role,
  department, skill, or interest
- **Hybrid Recommendation Engine** — content-based filtering (implemented),
  collaborative filtering and hybrid scoring (in progress)
- **Mentorship & Connection Requests** *(in progress)*
- **Opportunity Sharing, Event Management, Flight Reconnect, Admin**
  *(planned)*

## Evaluation

The recommendation framework will be evaluated using Precision@K,
Recall@K, F1-score, NDCG, and user feedback, per the methodology in
Chapter 3 of the project proposal.


## Author

Kamau Edwin Kamau (152803)\
ICS 4, Group B\
Supervisor: Julliet Kirui\
Strathmore University, School of Computing and Engineering Sciences
