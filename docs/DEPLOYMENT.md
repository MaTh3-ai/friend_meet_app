# Deployment and operations

## Déploiement : un serveur, Docker Compose et HTTPS

This works on a conventional Linux VPS/VM, including an AWS EC2 machine. It requires a domain pointing to the server and inbound TCP ports 80 and 443. It is not a static-only upload: the app needs its Node server and persistent SQLite volume.

Une seule pile Compose lance deux conteneurs : l’application Node.js et Caddy pour HTTPS. La base SQLite est un fichier **commun à tous les participants** dans un volume Docker persistant, pas une base par navigateur ni un service PostgreSQL à brancher. Utiliser une seule instance de l’application et un stockage local : ne pas multiplier les réplicas SQLite ou utiliser un volume réseau pour partager le fichier entre serveurs.

Prérequis : un serveur Linux, Git, Docker avec Compose récent, OpenSSL, un domaine pointant sur le serveur, et les ports TCP 80 et 443 accessibles. Le dépôt GitHub est privé : le compte ou la clé SSH du serveur doit avoir accès.

```sh
git clone https://github.com/MaTh3-ai/friend_meet_app.git
cd friend_meet_app
sh scripts/setup.sh rencontre.example.fr contact@example.fr
docker compose up -d --build --wait
docker compose ps
```

Remplacer le domaine et le contact par les vrais. `setup.sh` crée une seule fois un `.env` à permissions restreintes, avec un code démo aléatoire ; il refuse de remplacer un `.env` existant. Le code se trouve dans la variable `DEMO_ACCESS_CODE` de ce fichier : le communiquer uniquement aux participants invités. Ne jamais committer ou publier `.env`. L’accès démo ne prouve pas l’inscription à l’UPPA. Sans domaine HTTPS et code suffisamment long, le mode production refuse de démarrer.

Ouvrir `https://rencontre.example.fr` avec le vrai domaine. Caddy obtient le certificat si le DNS et les ports sont correctement configurés. Le serveur d’application n’est pas exposé directement sur un port public. Vérifier le parcours complet depuis deux navigateurs distincts, notamment une demande réciproque de partage. Un clone est séparé : les profils de développement locaux ne sont pas automatiquement transférés vers le serveur.

Pour une mise à jour depuis `main` :

```sh
git pull --ff-only origin main
docker compose up -d --build --wait
docker compose ps
docker compose logs --tail=50 app
```

Le volume `app_data` reste attaché aux recréations du conteneur. Utiliser toujours le même dossier et le même nom de projet Compose : changer ces éléments peut créer un autre volume et donner l’impression que la base est vide. Ne pas utiliser `docker compose down -v` sur le serveur : cette option supprime aussi les volumes et donc les données.

Pour créer une sauvegarde cohérente sans arrêter l’application :

```sh
sh scripts/backup.sh /chemin/protege/meeting-ground-2026-11-09.sqlite
```

Le fichier de destination ne doit pas déjà exister ; le dossier doit être accessible en écriture. Le script utilise l’API de sauvegarde SQLite, y compris les données WAL validées. Il crée un fichier privé : stocker et transférer la sauvegarde de façon chiffrée, hors du dépôt, tester régulièrement sa restauration et définir sa durée de conservation. Une restauration est une opération administrateur qui remplace les données actives : arrêter l’application, vérifier et restaurer la base avec sa politique de suppression, puis redémarrer et contrôler avant de rouvrir.

Le workflow GitHub Actions construit la pile dans un environnement jetable et vérifie HTTPS, deux participants, la persistance après recréation et une sauvegarde. Ce contrôle ne remplace pas un test sur votre serveur, votre domaine et de vrais téléphones. Le projet reste un MVP pour pilote : la vérification CAS UPPA, la modération, la résistance à l’inférence du score et le dimensionnement ne sont pas validés pour une ouverture générale.

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
- For a consistent online backup use `sh scripts/backup.sh /secure/path/snapshot.sqlite`. Do not copy a live SQLite main file while ignoring its WAL. Keep backups encrypted and outside the repository.
- For an event-only trial, set a short retention period (for example 2 days) before the event. The default is 30 days because continuation is undecided.

## Operating limits and maintenance

The MVP targets a small student cohort on one server. It is not an unrestricted public social network: there is no report review console, moderator workflow or distributed database. Before a wider launch, assign an operator/contact, define moderation and retention, confirm CAS, and load-test for the actual cohort size.

Keep Node/container images and dependencies patched, and use the locked dependency install in CI. Do not log request bodies or CAS tickets. Caddy access logs are disabled in the supplied configuration; configure any additional proxy to redact query strings for `/auth/cas/callback`.

Health check: `GET /healthz` returns a database-backed health result. An unavailable backend produces a retryable UI error; do not replace errors with fictional successful requests.
