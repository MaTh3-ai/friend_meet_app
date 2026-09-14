# Contribuer à Friend Meet App

Commencez par le [README](README.md), les [consignes du projet](AGENTS.md) et la [documentation](docs/ARCHITECTURE.md).

## Installation

Utilisez Node.js 24.15+ dans la série 24.x et pnpm 11.19.0 (version du champ `packageManager`).

```sh
pnpm install --frozen-lockfile
pnpm dev
```

L’application démarre sur http://localhost:3000. Aucun compte payant ni `.env` n’est nécessaire en démo locale. Pour tester deux personnes, utilisez deux navigateurs ou une fenêtre privée. Les données locales sont dans `data/`, exclu du dépôt.

## Branches et revues

```sh
git switch develop
git pull --ff-only
git switch -c feat/description-courte
```

Travaillez sur une modification ciblée. Utilisez `fix/…` pour une correction ou `docs/…` pour la documentation. Poussez votre branche et ouvrez une PR vers `develop`. Expliquez le problème résolu, le comportement final et les vérifications. Faites relire avant fusion. Les livraisons stables utilisent une PR `develop` vers `main`. Ne forcez pas de push sur les branches partagées.

Avant de pousser :

```sh
pnpm format
pnpm format:check
pnpm test
pnpm build
```

Testez le parcours concerné en anglais et en français, au clavier et sur une largeur mobile. Une modification des règles de visibilité, des contacts ou des données privées nécessite un test API avec plusieurs sessions. Toute évolution des données déjà livrées doit avoir une migration versionnée et testée.

## Règles produit

- Interface en anglais par défaut, français via `t(en, fr)` ; questions dans `shared/questions.js`.
- Ne jamais exposer réponses, textes privés, identité, préférences ou sessions dans les résultats d’autrui.
- Réseaux sociaux partagés seulement après accord réciproque ; blocage, masquage et suppression doivent rester effectifs.
- Les scores sont simulés. Ne les présentez pas comme une mesure scientifique.
- Pas de secret, base SQLite, profil réel ou `.env` dans un commit, un ticket ou une capture.
- Utilisez des données fictives pour reproduire les problèmes. Signalez les problèmes de sécurité au propriétaire en privé.

Le déploiement reste une opération séparée ; voir [DEPLOYMENT.md](docs/DEPLOYMENT.md).
