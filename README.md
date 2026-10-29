# N'GOWA — Apprendre. Jouer. Comprendre. Agir.

Aventure éducative écologique pour les enfants de 4 à 10 ans en Côte d'Ivoire.
Application web mobile-first, **offline-first**, sans compte ni donnée personnelle collectée.

## Démarrer

```bash
npm install
npm run dev          # développement
npm run build && npm run start   # production (le service worker n'est actif qu'en production)
```

## Vérifications

```bash
npm run typecheck
npm run lint
npm test             # tests unitaires (vitest) : points, pins, défis, temps d'écran, sauvegarde, code parent
npm run test:e2e     # parcours complet dans Chromium (Playwright requis, serveur lancé ; BASE_URL configurable)
```

## Architecture

| Dossier | Rôle |
| --- | --- |
| `src/content/` | Contenus éditoriaux : zones, missions du Village du Tri, défis réels, pins (seuils configurables dans `pins.ts`), personnages. Les contenus des autres piliers (leçons, quiz, eau, biodiversité, énergie) sont conservés pour les futures zones. |
| `src/lib/game/` | Logique pure et testée : `rules.ts` (points, compétences, déblocages, pins, défis), `screenTime.ts`, `save.ts` (sauvegarde locale versionnée et réparée si abîmée), `parentPin.ts`, `store.ts` (store React + horloge). |
| `src/components/screens/` | Écrans : accueil, création du profil, carte, zone, mission, pins, défis, espace parent, fiche, pause / fin de journée. |
| `src/components/game/SortGame.tsx` | Mini-jeu de tri : glisser-déposer au doigt, ou toucher d'un bac (accessible au clavier). |
| `src/components/art/` | Illustrations SVG originales (carte, village, bacs, pins). |
| `public/sw.js` | Service worker : met en cache la page, ses scripts, polices et images. |

Toute la progression est dans le `localStorage` de l'appareil (clé `ngowa.sauvegarde`). Il n'y a plus de base de données ni d'API.

## Principes produit

- Points de jeu (meilleur score par mission : rejouer ne « farme » pas), compétences montrées en jeu, et défis réels
  (accepté → déclaré par l'enfant → validé par un adulte) sont **comptés séparément**.
- Pas de publicité, pas d'achat, pas de classement, pas de profil public, pas de photo ni de localisation demandée.
- Temps d'écran : 4-5 ans 15/30 min, 6-8 ans 20/40 min, 9-10 ans 30/60 min (session/jour). Préavis, mission
  toujours terminée, pause de 10 min avec activité hors écran, extension possible par un adulte.
