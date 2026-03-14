# Lab 10 — Gestion de l'etat

## Objectif

Implementer en pur TypeScript les mecanismes fondamentaux de la gestion d'etat : store reactif, selecteurs, slices, persistence et combinaison de stores.

## Prerequis

- Module 10 : Gestion de l'etat (Context et Zustand)
- TypeScript : generics, closures, Set, Record

## Lancement

```bash
# Exercice (tests en echec)
npx tsx labs/lab-10-gestion-detat/exercise.ts

# Solution (tous les tests passent)
npx tsx labs/lab-10-gestion-detat/solution.ts
```

## Exercices

### Exercice 1 : createStore (6 tests)

Creez un store minimaliste inspire de Zustand avec :
- `getState()` : retourne l'etat courant
- `setState(partial)` : fusionne un objet partiel ou le resultat d'une fonction
- `subscribe(listener)` : enregistre un listener, retourne `unsubscribe`
- `destroy()` : supprime tous les listeners

### Exercice 2 : createSelector (3 tests)

Creez un selecteur qui observe un store et ne notifie les listeners que si la valeur selectionnee change (comparaison `===`). C'est le mecanisme cle qui evite les re-renders inutiles dans Zustand.

### Exercice 3 : createSlice (3 tests)

Creez un "slice" (tranche d'etat) avec un nom, un etat initial et des actions. Les actions recoivent `(set, get)` pour modifier et lire l'etat. C'est le pattern utilise pour decouper un gros store en modules.

### Exercice 4 : persistMiddleware (3 tests)

Ajoutez la persistence a un store existant :
- A l'initialisation, restaurer l'etat depuis le storage
- A chaque changement, sauvegarder dans le storage
- Ignorer les valeurs invalides (JSON.parse echoue)

### Exercice 5 : combineStores (3 tests)

Combinez plusieurs stores en un objet unique :
- `getState()` retourne `{ auth: authState, cart: cartState, ... }`
- `subscribe()` notifie quand n'importe quel sous-store change
- `destroy()` nettoie tout

## Concepts cles

- **Store reactif** : le pattern observer applique a l'etat applicatif
- **Selecteurs** : evitent les re-renders en comparant les valeurs selectionnees
- **Slices** : decoupent un store complexe en modules independants
- **Persistence** : middleware qui intercepte les changements pour sauvegarder
- **Composition** : combiner des stores independants pour un acces unifie
