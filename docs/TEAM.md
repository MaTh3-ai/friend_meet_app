# Organisation de l’équipe

Dépôt privé : https://github.com/MaTh3-ai/friend_meet_app. Le nom du produit est Meeting Ground.

## Repères

| Zone                                | Fichiers                                              |
| ----------------------------------- | ----------------------------------------------------- |
| Parcours et textes bilingues        | `src/main.jsx`                                        |
| Présentation et réponses des cartes | `src/SwipeCard.jsx`                                   |
| Style et avatars                    | `src/styles.css`, `src/Avatar.jsx`, `public/avatars/` |
| Questions et catalogue              | `shared/questions.js`                                 |
| API et confidentialité              | `server/app.js`, `server/validation.js`               |
| Base et migrations                  | `server/db.js`                                        |
| Authentification et CAS             | `server/auth.js`, `docs/CAS.md`                       |
| Tests                               | `tests/app.test.js`                                   |

## Contrôles GitHub

Le workflow **Check** exécute le job **test-and-build** sur les push, les pull requests et à la demande : installation verrouillée, format, tests API et compilation. Les permissions du workflow sont limitées à la lecture du contenu. Les exécutions obsolètes d’une même branche sont annulées. Aucun secret ni accès à une base réelle n’est requis.

Pour protéger `main`, le propriétaire peut activer dans Settings → Branches une règle : PR obligatoire, une approbation, contrôle `test-and-build` réussi, conversations résolues, interdiction de suppression et de force-push. L’activation dépend des droits et du forfait GitHub du dépôt privé ; ce document ne signifie pas que la règle est déjà active. Sur `develop`, imposer au minimum la réussite de CI et une revue selon la taille de l’équipe.

## Accès des étudiants

Le propriétaire invite les comptes GitHub identifiés dans Settings → Collaborators. Le dépôt reste privé. Aucune invitation n’est automatique et aucun compte n’est présumé autorisé. Une fois l’invitation acceptée, suivre le README et CONTRIBUTING.

## Prochaine phase

- Tester le parcours sur de vrais téléphones avec quelques étudiants.
- Valider les formulations EN/FR et l’accessibilité des cartes ; choisir les captures de références.
- Tester et valider l’indice expérimental, notamment les risques d’inférence ; les scores fictifs restent simulés.
- Confirmer l’intégration CAS et les attributs étudiants avec l’UPPA.
- Choisir l’opérateur, le domaine et le serveur avant tout déploiement partagé.

L’application n’a pas de chat intégré ni de notifications. Le consentement ouvre l’accès aux identifiants Instagram/Discord saisis ; il n’envoie aucun message sur ces services.
