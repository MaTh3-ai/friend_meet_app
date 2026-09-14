# Deployment and operations

## Recommended: one server, Docker Compose and HTTPS

This works on a conventional Linux VPS/VM, including an AWS EC2 machine. It requires a domain pointing to the server and inbound TCP ports 80 and 443. It is not a static-only upload: the app needs its Node server and persistent SQLite volume.

1. Install Docker with the Compose plugin on the server.
2. Copy/clone this project. Copy `.env.example` to `.env`.
3. Set:

```dotenv
APP_ORIGIN=https://your-domain.example
SITE_DOMAIN=your-domain.example
AUTH_MODE=demo
DEMO_ACCESS_CODE=replace-with-a-random-session-code
RETENTION_DAYS=30
PRIVACY_CONTACT=your-project-contact
```

Use an actual domain and contact. Generate a random demo code, for example using `node -e "console.log(require('node:crypto').randomBytes(18).toString('base64url'))"`. Share it privately with participants. The hosted app refuses to start with an absent/short demo code or a non-HTTPS origin. An access code is an invitation gate, **not UPPA verification**.

4. Start:

```sh
docker compose up -d --build
docker compose ps
docker compose logs --tail=50 app
```

Caddy obtains HTTPS certificates automatically. The app port is exposed only to the internal Compose network. The app runs as an unprivileged user. Database data is in the `app_data` volume and survives rebuilds.

5. Visit the HTTPS domain, join from two browsers, complete both profiles and test a mutual hello. Put **that domain** in the presentation QR code; do not use localhost. The final domain is not yet known, so no misleading deployment QR code is bundled.

The container recipe is supplied but cannot be described as deployed or verified on your group's server until it has actually run there.

## Existing reverse proxy / no Docker

Use Node 24.15+ (24.x), install dependencies and build:

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

Set `.env` to the exact HTTPS `APP_ORIGIN` (no trailing slash), strong demo code or complete CAS configuration, and `TRUST_PROXY=1` only if there is exactly one trusted reverse proxy. Forward to port 3000 and prevent direct public access to that port. Use your normal process supervisor (systemd, for example). Keep a writable persistent `data/` directory and run one app instance. The same server serves frontend and API; no CORS setup is needed.

For a temporary test on your own LAN, development mode can use `APP_ORIGIN=http://YOUR-LAN-IP:3000`. All testers must use that exact origin. Never use development mode for internet hosting.

## Data lifecycle

- A demo session lasts 7 days and is linked to the browser cookie. There is no account recovery in demo mode. Clear this expectation before testing.
- Accounts expire after `RETENTION_DAYS` without a profile, answer, contact or visibility update. Reading results alone does not reset retention. Cleanup runs at startup and hourly.
- Explicit deletion removes the user, private data, sessions, contact relationships and blocks from the active database. SQL foreign keys enforce cascading deletion.
- SQLite storage and backups are not encrypted by the app. Use encrypted server disks and restrict filesystem access. Do not expose database files as static assets.
- If backups are enabled, define a short retention period and tell participants. Restoring a backup must not silently restore previously deleted profiles: keep a separate restricted deletion process, or expire/purge restored data before reopening access. The MVP does not implement backup deletion propagation.
- For a consistent manual backup, stop the app, back up the volume, then restart. Do not copy a live SQLite main file while ignoring its WAL. Keep backups encrypted and outside the repository.
- For an event-only trial, set a short retention period (for example 2 days) before the event. The default is 30 days because continuation is undecided.

## Operating limits and maintenance

The MVP targets a small student cohort on one server. It is not an unrestricted public social network: there is no report review console, moderator workflow or distributed database. Before a wider launch, assign an operator/contact, define moderation and retention, confirm CAS, and load-test for the actual cohort size.

Keep Node/container images and dependencies patched, and use the locked dependency install in CI. Do not log request bodies or CAS tickets. Caddy access logs are disabled in the supplied configuration; configure any additional proxy to redact query strings for `/auth/cas/callback`.

Health check: `GET /healthz` returns a database-backed health result. An unavailable backend produces a retryable UI error; do not replace errors with fictional successful requests.
