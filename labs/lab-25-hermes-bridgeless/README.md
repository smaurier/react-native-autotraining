# Lab 25 — Hermes Engine et mode Bridgeless

## Objectifs

Maitriser les mecanismes internes de Hermes et du mode Bridgeless en TypeScript pur : analyse bytecode, heap snapshots, profiling, suivi de startup et garbage collection.

## Exercices

### Exercice 1 : analyzeBytecodeSize
Analysez la taille du bytecode par module, calculez le total et suggerez des optimisations (lazy-load, tree-shake, code-split).

### Exercice 2 : createHeapSnapshot
Creez un snapshot du heap pour detecter les fuites memoire : objets detaches et gros objets avec references circulaires.

### Exercice 3 : createProfiler
Implementez un profiler avec flame chart et detection des hot paths (fonctions gourmandes).

### Exercice 4 : createStartupTracker
Suivez les phases de demarrage (native init, JS init, render, TTI) et calculez la duree totale.

### Exercice 5 : createGCSimulator
Simulez un garbage collector generationnel : allocation, collecte des temporaires, promotion des survivants.

## Lancement

```bash
# Exercice
npx tsx labs/lab-25-hermes-bridgeless/exercise.ts

# Solution
npx tsx labs/lab-25-hermes-bridgeless/solution.ts
```
