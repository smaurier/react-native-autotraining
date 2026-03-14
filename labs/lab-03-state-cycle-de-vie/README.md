# Lab 03 — State et cycle de vie

## Objectif

Pratiquer les concepts de gestion d'etat et de cycle de vie en simulant les mecanismes de React en TypeScript pur : store reactif, reducer, debouncer, mises a jour immutables, et suivi du cycle de vie.

## Prerequis

- Module 03 : State et cycle de vie
- TypeScript : generiques, closures, callbacks

## Lancer les tests

```bash
# Exercice (les tests echouent — a vous de completer)
npx tsx labs/lab-03-state-cycle-de-vie/exercise.ts

# Solution (tous les tests passent)
npx tsx labs/lab-03-state-cycle-de-vie/solution.ts
```

## Exercices

### 1. `createStore(initialState)` — Store reactif

Implementez un store type Zustand simplifie :
- `getState()` retourne l'etat courant
- `setState(partial)` fusionne un objet partiel (ou une fonction) et notifie les subscribers
- `subscribe(listener)` enregistre un listener et retourne une fonction `unsubscribe`
- `getSubscriberCount()` retourne le nombre de subscribers actifs

### 2. `createReducerStore(reducer, initialState)` — Simulation useReducer

Implementez un store base sur le pattern reducer :
- `dispatch(action)` applique le reducer et notifie les subscribers
- Le reducer est une fonction pure `(state, action) => newState`

### 3. `createDebouncer(fn, delay)` — Debouncer

Implementez un debouncer avec :
- `call(...args)` : planifie l'execution apres `delay` ms
- `cancel()` : annule l'execution en attente
- `flush()` : execute immediatement si en attente
- `getCallCount()` : nombre d'executions reelles
- `getPendingCount()` : 1 ou 0 selon l'etat

### 4. `immutableUpdate(obj, path, value)` — Mise a jour immutable

Met a jour une valeur dans un objet/tableau imbrique sans muter l'original.
Le chemin est un tableau de cles `(string | number)[]`.

### 5. `createLifecycleTracker()` — Suivi du cycle de vie

Enregistre les evenements mount/update/unmount avec validation :
- `mount()` ne peut etre appele que si pas deja monte
- `update()` necessite un mount prealable
- `unmount()` necessite un mount prealable

## Nombre de tests : 18

## Duree estimee : 40-50 min
