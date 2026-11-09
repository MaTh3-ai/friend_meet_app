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

Only `/api/me` and `/api/me/export` expose the current user's private data. The matching API uses `publicProfile()` to whitelist name, avatar, age, study level (`course`) and bio. It adds an overall simulated score and connection state. Contacts are added only for mutually connected, visible, eligible, unblocked users. Responses never include private answer vectors, texts, identity, preferences, CAS identifiers or component scores. Profile visibility is rechecked on every match/request read or mutation.

Backend privacy is enforced independently of UI controls. All SQL values are bound parameters. Zod validates writes. Origin checking plus a custom request header protects mutations against cross-site requests. Cookies are HttpOnly, SameSite=Lax and Secure in production. Helmet adds security headers and a same-origin CSP. Request bodies are bounded and API traffic is rate limited. External contact handles are validated and only used under a fixed Instagram hostname.

This does not guarantee immunity to inference: filtered inclusion can reveal something about discovery preferences. Any future answer-dependent score may leak information under repeated probing. Do not expose pairwise explanation details; assess quantization, rate limits and abuse resistance when a real engine is introduced.

## Replace the simulation

Current adapter contract:

```js
const engine = {
  version: "simulation-v1",
  simulated: true,
  score(privatePersonA, privatePersonB) {
    /* integer 0–100, possibly async */
  },
};
```

Both the questionnaire and semantic components are mock hash values; their average is an explicitly arbitrary demonstration. Answers and texts are not used in these numbers. No embedding is generated, stored or sent externally.

The `scenario-v3` ratings provide 13 stable named numeric dimensions, with null for an unanswered interest. They are private raw inputs, not an embedding, and do not affect the demo score. Versioned historical responses remain in the account export.

For the next phase, implement questionnaire feature extraction, text embedding/comparison and score calibration behind the adapter. Store the questionnaire version, model version and engine version with any cached result. Handle missing/skipped answers and empty texts deliberately. Choose weights from evidence and validation; do not preserve demo averaging by accident. Revisit UI labels and uncertainty before setting `simulated: false` (the current API/UI intentionally hard-code prototype disclosure).

Discovery eligibility is separate from score. Both participants' optional gender filters must allow the other. No intent/sexual orientation is inferred or displayed. Unspecified identity cannot satisfy a gender-specific filter.

## Growth limits

SQLite is suitable for one small cohort on one instance. Each result refresh currently reads eligible accounts and computes scores for that user, with relationship lookups per candidate. Move to batched queries, pagination and score caching after measuring actual load. Do not introduce multiple independent SQLite replicas. A later migration to PostgreSQL should preserve the API/data projections.

The database uses `PRAGMA user_version=2`. The transactional v1→v2 migration removes legacy pronouns from profile JSON and normalizes course values to the study-level enum. Unknown legacy course text becomes unspecified; relational data and all other fields are unchanged. Migration is tested for preservation and idempotence. Future structural changes must have explicit forward migrations and migration tests; do not rely on `CREATE TABLE IF NOT EXISTS` to alter existing tables.
