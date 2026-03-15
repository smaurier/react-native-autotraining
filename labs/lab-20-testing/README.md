# Lab 20 — Testing React Native

## Objectif

Implementer en pur TypeScript des outils de test : renderer de composants virtuels, mock store, mock API, gestionnaire de snapshots et tracker de couverture de code.

## Prérequis

- Module 20 : Testing React Native
- TypeScript : interfaces, generics, Map, Set, Promise

## Lancement

```bash
# Exercice (tests en echec)
npx tsx labs/lab-20-testing/exercise.ts

# Solution (tous les tests passent)
npx tsx labs/lab-20-testing/solution.ts
```

## Exercices

### Exercice 1 : createTestRenderer (4 tests)

Simulez un renderer de composants React sous forme d'arbre virtuel. Implementez `rerender` (mise a jour des props), `unmount` (bloque les operations suivantes), `getByProps` (recherche recursive par props) et `getByType` (recherche recursive par type).

### Exercice 2 : createMockStore (4 tests)

Simulez un store Redux/Zustand avec tracking des actions dispatchees. Les reducers optionnels sont appliques au dispatch. Implementez `subscribe` avec desinscription et `reset` pour revenir a l'état initial.

### Exercice 3 : createMockApi (4 tests)

Simulez une API HTTP avec des handlers predetermines (GET, POST, DELETE). Retournez 404 pour les routes non configurees. Enregistrez chaque requête dans un log consultable avec `getRequestLog`.

### Exercice 4 : createSnapshotManager (4 tests)

Gerez des snapshots comme Jest : `take` (créer), `compare` (vérifier la correspondance), `update` (créer ou modifier) et `delete`. `take` leve une erreur si le snapshot existe déjà.

### Exercice 5 : createCoverageTracker (4 tests)

Suivez la couverture de code par fichier et par ligne. Detectez les fichiers inconnus et les lignes hors limites. Generez des rapports par fichier et un rapport global avec pourcentage de couverture.

## Évaluation

- 20 tests au total
- Tous les tests doivent passer
- Les types TypeScript doivent etre corrects
