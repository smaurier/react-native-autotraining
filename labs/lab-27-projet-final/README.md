# Lab 27 — Projet final NomadNote

## Objectif

Implementer la logique metier complete de NomadNote, l'application de notes collaborative offline-first. Ce lab couvre les 9 piliers fonctionnels de l'application sous forme de fonctions pures TypeScript.

## Concepts clés

### Modèle de note (CRUD)

Le modèle `Note` est le coeur de l'application. Les operations CRUD (Create, Read, Update, Delete) manipulent des objets immutables avec versioning (`syncVersion`) pour la synchronisation. Le delete est un soft-delete (champ `deletedAt`) pour permettre la reconciliation offline.

### Système de tags

Les tags permettent d'organiser les notes par categories. La comparaison est insensible à la casse pour éviter les doublons (`React` et `react` sont consideres identiques). Le filtrage utilise une logique AND : seules les notes possedant tous les tags demandes sont retournees.

### Recherche

Trois modes de recherche sont implementes :
- **Plein texte** : recherche dans le titre, le contenu, les tags et le label de localisation avec scoring par pertinence
- **Par date** : filtrage par plage temporelle sur `createdAt`
- **Par localisation** : filtrage par rayon geographique en utilisant la formule de Haversine

### Moteur de synchronisation

Le sync engine géré la file d'operations en attente et la fusion des donnees locales/distantes. La résolution de conflits utilise d'abord le `syncVersion` (le plus eleve gagne), puis le Last-Write-Wins base sur `updatedAt` en cas d'egalite.

### Chiffrement

Implementation pedagogique d'un chiffrement XOR avec encodage base64. En production, cela serait remplace par AES-256-GCM via un Turbo Module natif (module 23).

### Gestion de la collaboration

Le système de permissions a trois niveaux (read, write, admin) plus le role proprietaire (auteur). Chaque niveau hérité des permissions du niveau inferieur.

### File d'attente offline

La queue géré les operations en attente avec un cycle de vie : pending → processing → completed/failed. Les éléments echoues peuvent etre remis en attente avec `retry`.

### Cache LRU

Le cache utilise l'algorithme Least Recently Used pour maintenir en mémoire les notes les plus consultees. Quand le cache est plein, la note la plus anciennement accedee est evincee.

### Dispatcher de notifications

Le dispatcher géré les notifications immediates et planifiees (avec delai). Les notifications planifiees ne sont visibles dans `getUnread` qu'après avoir ete marquees comme recues via `handleReceived`.

## Exercices

```bash
npx tsx exercise.ts
```

## Vérification de la solution

```bash
npx tsx solution.ts
```

42 tests couvrent l'ensemble des 9 exercices.
