# Lab 19 — Performance et optimisation

## Objectif

Implementer en pur TypeScript des outils de suivi de performance : tracking des renders, memoization avec metriques, analyse de bundle, suivi mémoire et batching des mises a jour.

## Prérequis

- Module 19 : Performance et optimisation
- TypeScript : Map, closures, generics

## Lancement

```bash
# Exercice (tests en echec)
npx tsx labs/lab-19-performance/exercise.ts

# Solution (tous les tests passent)
npx tsx labs/lab-19-performance/solution.ts
```

## Exercices

### Exercice 1 : createRenderTracker (4 tests)

Creez un tracker de renders qui enregistre chaque render d'un composant avec ses props et un timestamp. Le tracker détecté les re-renders "inutiles" : ceux ou les props sont identiques (deep equal via JSON.stringify) au render précédent.

### Exercice 2 : memoize (3 tests)

Implementez une fonction de memoization générique qui cache les résultats en utilisant `JSON.stringify(args)` comme clé. La fonction retournee expose des metriques : `cacheHits`, `cacheMisses`, `cacheSize` et une méthode `clearCache()`.

### Exercice 3 : createBundleAnalyzer (4 tests)

Analysez un graphe de modules avec tailles et dépendances. Implementez `getSize`, `getDependencies`, `getTotalSize`, `findHeaviest` (les n plus gros modules) et `suggestSplits` (découpage en chunks dont la somme des tailles ne dépasse pas un seuil).

### Exercice 4 : createMemoryTracker (4 tests)

Suivez les allocations et liberations mémoire. Detectez les fuites (allocations non liberees plus anciennes qu'un seuil). Gerez les erreurs : double allocation ou double liberation.

### Exercice 5 : batchUpdates (3 tests)

Regroupez des mises a jour individuelles en lots d'une taille donnee. Chaque lot contient le numéro du batch (1-based), les mises a jour et le nombre total d'éléments du lot.

## Évaluation

- 18 tests au total
- Tous les tests doivent passer
- Les types TypeScript doivent etre corrects
