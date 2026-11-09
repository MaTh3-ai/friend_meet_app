# Contributor and agent guide

- Work from this directory. Use Node 24.15+ (24.x) and the pinned pnpm version.
- Run `pnpm test` and `pnpm build` after behavior changes. Test privacy and multi-user behavior, not just rendering.
- Keep the interface English by default with French parity through the existing `t(en, fr)` convention. Keep question translations in `shared/questions.js`.
- Preserve the public profile whitelist. Never return private answers, texts, gender, preferences, session tokens or CAS identity keys in someone else's results.
- Never log request bodies or authentication callback query strings. Never store a university password.
- The score for real participants is experimental and unvalidated; it is not a prediction. Fictional profile scores are simulated and must remain labelled. Keep all scoring in `server/matching.js`; do not introduce scientific claims or weights without evidence. Assess inference risk before wider use.
- Demo mode must never imply verified UPPA enrolment. CAS must fail closed without confirmed student attributes.
- Do not merge fictional profiles into the real participant list or permit contacting them.
- Preserve consent-based contact exchange, hiding, blocking, export, deletion and relational cascades.
- Do not add external analytics, AI calls, uploads, paid services or another hosting platform without a concrete requirement.
- Use prepared SQL. Add versioned migrations before changing an already-shipped schema.
- Never commit `.env`, `data`, `node_modules`, generated test profiles or secrets. Keep the lockfile.
- Deployment is a single Node server and SQLite volume, optionally behind the supplied Caddy proxy. Document any change to operational assumptions.
