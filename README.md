# Friend Meet App · Common Ground

Repository: **MaTh3-ai/friend_meet_app** (private). Product name: **Common Ground**.

A mobile-first university social discovery app. English by default, French one tap away. Built as a complete self-hosted MVP for students at UPPA.

**Status:** functional demo. Real participants, durable profiles and mutual contact sharing work. Compatibility scores are explicitly simulated. UPPA CAS integration exists behind configuration but has **not** been validated against the university service. Demo access does **not** verify student status.

## Run locally

Install Node.js **24.15 or later in the 24.x line**, then:

```sh
npm install --global pnpm@11.19.0
pnpm install --frozen-lockfile
pnpm dev
```

Open **http://localhost:3000**. No environment file is required for a local demo. SQLite is created automatically under `data/`. A server restart keeps the data. Separate browsers/private windows act as separate participants. The browser cookie is your demo login; do not clear it if you need to return to your account.

Frontend edits refresh through Vite. Restart `pnpm dev` after changing server code.

```sh
pnpm test
pnpm build
```

Production uses the compiled frontend and requires HTTPS configuration; see [Deployment](docs/DEPLOYMENT.md). This project does not depend on Sites hosting, AWS-specific services or a paid AI API.

## The experience

1. Choose a first name or nickname and an avatar. Continue to optional details: Bachelor’s/Licence, Master or PhD/Doctorat, public bio, age (18+), private identity and discovery preferences.
2. Follow five illustrated story cards: single choices, private 1–10 interest ratings and multiple choices. The final card offers four reference images and two placeholders. You can skip any card or go back. Each answer saves before advancing.
3. Optionally add Instagram/Discord usernames. **Publish & meet people** makes your profile visible and opens discovery; there is no separate visibility checkbox.
4. Explore real participants. Results update every 12 seconds while the page is visible. Filter the simulated score between 30 and 100. Fictional examples live in a separate tab and cannot receive contact requests.
5. Ask to share contacts. After the other person accepts, Instagram/Discord handles become visible. Neither handle is required. Cancel, disconnect or block at any time.
6. In settings: edit, hide, export, unblock or permanently delete. Hiding excludes the profile and its contacts from future results.

## What is real and what is simulated?

| Real functionality                                          | Deliberately provisional                            |
| ----------------------------------------------------------- | --------------------------------------------------- |
| Multi-user server, sessions and SQLite persistence          | Pairwise score generator                            |
| Public/private data separation and mutual discovery filters | Questionnaire's scientific validity                 |
| Requests, mutual sharing, blocking, export, deletion        | Text similarity / embeddings                        |
| EN/FR UI and responsive layout                              | Live CAS service registration and affiliation claim |

The score is deterministic for a pair of IDs, symmetric, and independent of answers. It is **not** a probability of friendship or attraction. The two mock component scores and their equal weighting are arbitrary demo mechanics, not a scientific choice. See [Architecture](docs/ARCHITECTURE.md) for replacement boundaries.

## Team handover

- [Deployment and operations](docs/DEPLOYMENT.md)
- [CAS integration and questions for UPPA](docs/CAS.md)
- [Architecture, data and future scoring](docs/ARCHITECTURE.md)
- [Product decisions and next phase](docs/PRODUCT.md)
- [Validation record](docs/VALIDATION.md)
- [Agent/contributor instructions](AGENTS.md)

## Développer à plusieurs

```sh
git clone https://github.com/MaTh3-ai/friend_meet_app.git
cd friend_meet_app
git switch develop
pnpm install --frozen-lockfile
pnpm dev
```

Le dépôt est privé : un accès GitHub accordé par le propriétaire est nécessaire.
`main` contient la version stable ; `develop` sert à intégrer les changements. Créez une branche courte depuis `develop`, puis ouvrez une pull request vers `develop`. Les livraisons passent ensuite par une PR `develop` → `main`.

Lisez [CONTRIBUTING.md](CONTRIBUTING.md), [AGENTS.md](AGENTS.md) et [docs/TEAM.md](docs/TEAM.md) avant de contribuer. GitHub Actions lance les tests, la vérification du format et la compilation. **Aucun déploiement automatique n’est configuré** : le domaine, le serveur et les secrets d’hébergement restent à fournir. Publier le code sur GitHub ne met pas l’application en ligne.

N’ajoutez jamais `.env`, `data/`, bases SQLite, profils de test, `node_modules/` ou identifiants au dépôt. `.env.example` est un exemple sans secret.

## Dernière évolution de l’interface

Palette lavande/rose/menthe et texture légère ; quatre avatars vectoriels locaux avec relief ; accueil compact séparé des champs facultatifs ; cartes de scénario ; anglais simplifié ; échange réciproque des réseaux explicite. Les pronoms ont été retirés.

Le questionnaire `scenario-v4` propose 9 dimensions d’intérêt fixes, notées de 1 à 10 ou non renseignées. Les images de références disponibles peuvent être sélectionnées ; les emplacements Pop et Anime restent en attente. Les notes communes de `scenario-v3` sont reprises, et les réponses complètes des versions précédentes restent dans l’historique privé de l’export lors du prochain enregistrement. Ces notes forment des données structurées pour une utilisation future ; aucun modèle d’embedding ni calcul de compatibilité basé sur ces données n’est encore en place.

Au démarrage, la migration SQLite v2 retire l’ancien champ de pronoms et convertit les formations reconnues en `bachelor`, `master` ou `doctorate`. Une ancienne formation non reconnue devient non précisée. Les profils, réponses, contacts, sessions et relations sont conservés. Sauvegardez la base avant une mise à jour sur un serveur partagé.
