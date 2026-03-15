# Lab 00 — Prérequis TypeScript

## Objectifs

Valider vos connaissances TypeScript avant de plonger dans React Native. Tous les exercices sont en TypeScript pur (pas de JSX, pas de React Native).

## Exercices

| # | Fonction | Concept teste | Difficulte |
|---|----------|--------------|------------|
| 1 | `parseQueryString` | Manipulation de strings, Record | facile |
| 2 | `debounce` | Closures, timers, generics | moyen |
| 3 | `deepClone` | Recursion, types, instanceof | moyen |
| 4 | `groupBy` | Generics, Record, reduce | facile |
| 5 | `pipe` | Composition de fonctions, generics | moyen |
| 6 | `retry` | async/await, boucle, gestion d'erreurs | moyen |
| 7 | `createEventEmitter` | Generics avances, Map, Set | difficile |

## Lancer les tests

```bash
# Exercice (avec TODOs — tous les tests echouent)
npx tsx labs/lab-00-prerequis-setup/exercise.ts

# Solution (tous les tests passent)
npx tsx labs/lab-00-prerequis-setup/solution.ts
```

## Conseils

- Commencez par les exercices les plus simples (1, 4)
- Utilisez les types TypeScript pour vous guider
- Les tests decrivent le comportement attendu — lisez-les attentivement
- N'hesitez pas a ajouter des `console.log` pour debugger
