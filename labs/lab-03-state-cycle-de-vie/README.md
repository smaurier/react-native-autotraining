# Lab 03 — State et cycle de vie

## Objectif

Pratiquer les concepts de gestion d'état et de cycle de vie en simulant les mécanismes de React en TypeScript pur : store réactif, reducer, debouncer, mises a jour immutables, et suivi du cycle de vie.

## Prérequis

- Module 03 : State et cycle de vie
- TypeScript : génériques, closures, callbacks

## Lancer les tests

```bash
# Exercice (les tests echouent — a vous de completer)
npx tsx labs/lab-03-state-cycle-de-vie/exercise.ts

# Solution (tous les tests passent)
npx tsx labs/lab-03-state-cycle-de-vie/solution.ts
```

## Exercices

### 1. `createStore(initialState)` — Store réactif

Implementez un store type Zustand simplifie :
- `getState()` retourne l'état courant
- `setState(partial)` fusionne un objet partiel (où une fonction) et notifie les subscribers
- `subscribe(listener)` enregistre un listener et retourne une fonction `unsubscribe`
- `getSubscriberCount()` retourne le nombre de subscribers actifs

### 2. `createReducerStore(reducer, initialState)` — Simulation useReducer

Implementez un store base sur le pattern reducer :
- `dispatch(action)` applique le reducer et notifie les subscribers
- Le reducer est une fonction pure `(state, action) => newState`

### 3. `createDebouncer(fn, delay)` — Debouncer

Implementez un debouncer avec :
- `call(...args)` : planifie l'exécution après `delay` ms
- `cancel()` : annule l'exécution en attente
- `flush()` : exécuté immediatement si en attente
- `getCallCount()` : nombre d'executions reelles
- `getPendingCount()` : 1 ou 0 selon l'état

### 4. `immutableUpdate(obj, path, value)` — Mise a jour immutable

Met a jour une valeur dans un objet/tableau imbrique sans muter l'original.
Le chemin est un tableau de clés `(string | number)[]`.

### 5. `createLifecycleTracker()` — Suivi du cycle de vie

Enregistre les événements mount/update/unmount avec validation :
- `mount()` ne peut etre appele que si pas déjà monte
- `update()` nécessité un mount prealable
- `unmount()` nécessité un mount prealable

## Nombre de tests : 18

## Duree estimee : 40-50 min
