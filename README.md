# Intelligent Stakeholder Matching for Mentorship and Professional Networking Using Hybrid Recommendation Techniques: A Case of Kenya Airways

An intelligent, web-based stakeholder matching platform designed to connect Kenya Airways Pride Centre alumni, current staff, former employees, administrators, and verified frequent flyers for structured mentorship and professional networking.

---

## Overview

Within large organizational communities such as Kenya Airways, professional networking and mentorship opportunities often occur organically or remain fragmented across informal communication channels, personal contacts, and unverified social media groups. This lack of centralized structure makes it difficult for stakeholders to identify relevant mentors, peers, and collaborators based on skills, domain experience, and career trajectories.

This project introduces an intelligent stakeholder matching framework that integrates disparate stakeholder groups into a unified digital environment. By leveraging a hybrid recommendation engine, the platform automates and optimizes mentor discovery, professional networking, opportunity sharing, and post-travel reconnection.

---

## Key Modules and Features

### 1. Stakeholder Profiling and Role-Based Access
- Support for multiple stakeholder personas: Pride Centre trainees and alumni, current staff, former employees, frequent flyers, and administrators.
- Comprehensive profile attributes including aviation specialization, technical skills, department, training history, mentorship availability, and professional interests.

### 2. Hybrid Recommendation Engine
- Automatically computes and ranks mentor and networking suggestions using a combination of Content-Based Filtering (CBF) and Collaborative Filtering (CF).
- Mitigates cold-start challenges for newly registered stakeholders while adapting to community interaction patterns over time.

### 3. Mentorship and Networking Management
- End-to-end workflow for sending, receiving, accepting, and declining mentorship requests.
- Direct peer-to-peer connection management and interaction tracking.

### 4. Flight Reconnect Module
- A consent-based, privacy-first feature enabling verified frequent flyers and staff to establish professional connections based on shared flight routes and travel dates.

### 5. Opportunity and Event Hub
- Centralized board for posting and discovering aviation-related career openings, internships, industry workshops, and alumni reunions.

### 6. Administrative and Moderation Portal
- Institutional verification of credentials and stakeholder roles.
- Platform monitoring, feedback collection, and content moderation to maintain community standards and security.

---

## Recommendation Methodology

The platform applies a weighted hybrid recommendation strategy that integrates profile-based similarity with collaborative interaction history:

### 1. Content-Based Filtering (CBF)
Evaluates stakeholder profile attributes (skills, department, industry background, mentorship goals) using vector similarity measures. This provides effective recommendations during initial user onboarding when interaction history is minimal.

### 2. Collaborative Filtering (CF)
Analyzes collective user behavior, including accepted connections, mentorship requests, profile interactions, and feedback ratings, to uncover implicit networking preferences across the community.

### 3. Hybrid Scoring Model
The combined score is calculated using the weighted formula:

$$\text{Hybrid Score} = (\alpha \times \text{Score}_{\text{CBF}}) + (\beta \times \text{Score}_{\text{CF}})$$

Where:
- $\alpha + \beta = 1$
- $\alpha$ represents the weight assigned to profile similarity (higher during early system stages).
- $\beta$ represents the weight assigned to interaction patterns (scaled as community engagement data increases).

---

## System Architecture and Design

The platform is designed following Object-Oriented Analysis and Design (OOAD) principles and developed using an Agile iterative approach.

- **Frontend and Backend:** Next.js with server-side rendering and API routes for recommendation processing.
- **Data Persistence:** Relational database management using PostgreSQL for structured stakeholder profiles, relationship graphs, and interaction logs.
- **Architectural Modeling:** System objects, use cases, sequence flows, and entity relationships modeled using UML and Draw.io.

---

## Evaluation Framework

The effectiveness and accuracy of the intelligent matching framework are evaluated using standard information retrieval and recommendation metrics:

- **Precision@K:** Measures the proportion of relevant recommendations within the top-ranked $K$ results.
- **Recall@K:** Evaluates the coverage of suitable mentors and connections retrieved from the total relevant pool.
- **F1-Score:** Provides the harmonic mean of precision and recall for balanced performance assessment.
- **Normalized Discounted Cumulative Gain (NDCG):** Evaluates the quality and ranking position of recommended stakeholders.
- **User Acceptance Testing (UAT):** Assesses user satisfaction, match relevance, and interface usability via stakeholder feedback.

---

## Privacy, Security, and Ethical Considerations

- **Consent-Driven Visibility:** Profile visibility and contact details remain protected and are only shared upon mutual request acceptance.
- **Data Minimization:** Sensitive travel and personal information used in the Flight Reconnect module are strictly opt-in and restricted to verified users.
- **Role-Based Access Control (RBAC):** Access to administrative, moderation, and member data is restricted based on authenticated roles.

---

## Academic Information

- **Project Title:** Intelligent Stakeholder Matching for Mentorship and Professional Networking Using Hybrid Recommendation Techniques: A Case of Kenya Airways
- **Author:** Kamau Edwin Kamau (Admission No: 152803)
- **Course:** Degree in Informatics and Computer Sciences (ICS 4 Group B)
- **Faculty:** School of Computing and Engineering Sciences (SCES)
- **Institution:** Strathmore University, Nairobi, Kenya
- **Supervisor:** Madam Julliet Kirui
- **Date:** June 2026

---

## Disclaimer

This software prototype was developed solely for academic research and capstone evaluation purposes at Strathmore University. It is not an officially deployed system of Kenya Airways PLC. All organizational references and trademarks belong to their respective holders.

---

## License

Distributed under the MIT License. See the LICENSE file for details.
