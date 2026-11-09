# Architecture

## Deliberately small stack

React UI built with Vite, Express server, Zod validation, SQLite through Node 24's built-in `node:sqlite`. One process and one durable database. No ORM, queue, external AI call or separate frontend hosting account is required. The production server serves the compiled UI and API on one origin.

```text
src/                 React interaction, bilingual copy, styling, API client
shared/questions.js  Versioned provisional cards and avatar catalog
server/app.js        API access rules and explicit response projections
server/auth.js       Demo sessions and replaceable CAS integration
server/db.js         Initial schema, persistence, deletion/retention
server/matching.js   Isolated scoring adapter + fictional examples
server/validation.js Server-side input validation
tests/               Integration and security behavior tests
```

## Data boundaries

`users` contains a UUID, optional pseudonymous CAS identity key, public/private profile fields, versioned answers, private text, optional contacts, visibility/completion and timestamps. JSON fields keep the evolving questionnaire simple while the relational database enforces account/relationship lifecycles. `sessions` stores hashes of random bearer cookies. `connections` stores directional requests; two directions mean mutual agreement. `blocks` excludes both people from each other's results. `auth_flows` stores one-use CAS state hashes.

Only `/api/me` and `/api/me/export` expose the current user's private data. The matching API uses `publicProfile()` to whitelist name, avatar, age, study level (`course`) and bio. It adds an overall experimental score or null and connection state. Fictional examples instead have simulated scores. Contacts are added only for mutually connected, visible, eligible, unblocked users. Responses never include private answer vectors, texts, identity, preferences, CAS identifiers or component scores. Profile visibility is rechecked on every match/request read or mutation.

Backend privacy is enforced independently of UI controls. All SQL values are bound parameters. Zod validates writes. Origin checking plus a custom request header protects mutations against cross-site requests. Cookies are HttpOnly, SameSite=Lax and Secure in production. Helmet adds security headers and a same-origin CSP. Request bodies are bounded and API traffic is rate limited. External contact handles are validated and only used under a fixed Instagram hostname.

This does not guarantee immunity to inference: filtered inclusion can reveal something about discovery preferences. The answer-dependent score may leak information about someone else's answers under repeated probing, including by changing one's own answers. The minimum-data rule reduces one direct disclosure but does not prevent reconstruction. Do not expose pairwise components. Evaluate quantization, rate limits, account controls and probing resistance before using real student data or broad deployment.

## Experimental similarity

`similarity-v1` is an experimental, symmetric score calculated on the server. At least three shared non-null slider ratings are needed for cosine similarity. Single choices score 1 for equality, 0 otherwise. Activity and available-reference sets use intersection divided by union; two empty sets and skipped answers are excluded. The remaining choice scores are averaged. When both sections exist, their scores have equal weight; when only one is usable it is returned as limited data. Without sliders, at least two comparable choice questions are required so a single equality test is not published directly. If neither section is usable, the score is null and the profile remains visible regardless of filter. The 50/50 split, thresholds and categorical scores are provisional product choices, not validated weights. Cosine on positive ratings can give high similarity even when absolute ratings differ.

The `scenario-v4` ratings provide nine named numeric dimensions. Compatible `scenario-v3` ratings are carried forward; unsupported older questionnaires do not contribute. Historical responses remain in the account export. No text embedding is generated. Fictional example scores continue to use the isolated `simulation-v1` adapter and are labelled as simulated.

Discovery eligibility is separate from score. Both participants' optional gender filters must allow the other. No intent/sexual orientation is inferred or displayed. Unspecified identity cannot satisfy a gender-specific filter.

## Growth limits

SQLite is suitable for one small cohort on one instance. Each result refresh currently reads eligible accounts and computes scores for that user, with relationship lookups per candidate. Move to batched queries, pagination and score caching after measuring actual load. Do not introduce multiple independent SQLite replicas. A later migration to PostgreSQL should preserve the API/data projections.

The database uses `PRAGMA user_version=2`. The transactional v1→v2 migration removes legacy pronouns from profile JSON and normalizes course values to the study-level enum. Unknown legacy course text becomes unspecified; relational data and all other fields are unchanged. Migration is tested for preservation and idempotence. Future structural changes must have explicit forward migrations and migration tests; do not rely on `CREATE TABLE IF NOT EXISTS` to alter existing tables.
