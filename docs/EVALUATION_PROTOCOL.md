# Recommendation evaluation protocol

This protocol is a template for collecting evidence; it contains no participant results. Obtain the institution's required ethics approval and informed consent before recruiting participants. Do not collect names, email addresses, or other unnecessary identifiers in the response sheet.

## Participant task

Ask each participant to use the same test account/data conditions and complete these tasks:

1. Find a potential mentor or peer for a stated professional goal.
2. Explain which profile details influenced the choice.
3. Rate how relevant the displayed recommendations are.
4. Repeat the task with the documented non-personalized baseline ranking.

Randomize whether the app or baseline is used first. Keep the candidate pool and task wording the same, and record the software revision, test-data version, task order, completion time, and any failures. The baseline must be defined before data collection (for example, alphabetic ordering); do not change it during a study.

## Short satisfaction questionnaire

Use the same 1–5 scale for each statement (1 = strongly disagree, 5 = strongly agree):

- The recommendations were relevant to my stated goal.
- The profile information helped me decide whether to connect.
- I understood why these people were recommended.
- I could find a useful person without excessive effort.
- I would use this feature again.

Optional free-text prompt: “What was confusing or unhelpful?” Do not interpret responses as measured outcomes until completed forms have been collected and summarized. Report the participant count, recruitment/consent process, missing responses, summary method, and anonymization method alongside any results.

## Manual baseline comparison

For each participant and task, record the top-five candidates from the application and baseline, task completion time, and a participant relevance rating for each candidate. Compare paired task times and paired relevance ratings, report the sample size and descriptive statistics, and preserve the raw data only under the approved retention policy. Do not describe the prototype's skill-overlap proxy metrics or internal holdout scores as participant satisfaction or as this manual comparison.

## Bounded local performance smoke test

Run the app locally, then use:

```powershell
$env:PERF_PATH = "/api/directory"
$env:PERF_COOKIE = "<authenticated session cookie>"
node scripts/performance-smoke.mjs http://localhost:3000 20 2
```

The harness is intentionally restricted to loopback hosts, at most 50 requests, concurrency at most 5, and a 30-second overall timeout. It prints HTTP statuses, median/p95 latency, and observed throughput. Use a valid session cookie only in the local process environment; do not paste it into source control, reports, or screenshots. A `401` means the request was not authenticated and is not a valid directory performance result. This smoke test is a repeatable small-scale check, not a production load or capacity test.

## Current automated acceptance behavior

- **TC-003 / profile input:** `tests/integration/api-profile-validation.test.js` verifies that the profile API rejects a missing full name and selection fields that are not arrays of string identifiers. It does not claim comprehensive validation of every profile field or semantic correctness of each identifier.
- **TC-007 / Flight Reconnect consent:** `tests/integration/api-flight-reconnect.test.js` verifies that a saved flight without sharing consent remains visible to its owner, while the GET request succeeds with an empty peer-match list. Non-consent is a privacy filter, not an authorization error or HTTP 403.

Update the proposal's test-case wording to match these observed acceptance criteria unless the intended behavior is changed in code.
