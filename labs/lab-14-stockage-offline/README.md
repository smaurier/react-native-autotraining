# Lab 14 — Stockage local et offline-first

## Objectif

Implementer en pur TypeScript les mécanismes fondamentaux d'une architecture offline-first : queue de synchronisation, résolution de conflits, migrations de donnees et cache LRU.

## Prérequis

- Module 14 : Stockage local et offline-first
- TypeScript : génériques, Map, closures
- Structures de donnees : FIFO queue, LRU cache

## Lancement

```bash
# Exercice (tests en echec)
npx tsx labs/lab-14-stockage-offline/exercise.ts

# Solution (tous les tests passent)
npx tsx labs/lab-14-stockage-offline/solution.ts
```

## Exercices

### Exercice 1 : createOfflineQueue (5 tests)

Creez une queue FIFO (First In, First Out) pour stocker les operations effectuees hors ligne. La queue supporte `enqueue`, `dequeue`, `peek`, `size` et `flush`. Chaque item à un id unique, un action, un payload, un timestamp et un compteur de retry.

### Exercice 2 : createSyncManager (3 tests)

Creez un gestionnaire de synchronisation qui traite tous les items de la queue via une fonction API asynchrone. Les items reussis sont retires, les items echoues sont remis dans la queue avec un `retryCount` incremente. Le statut passe de `idle` a `syncing` puis `done` ou `error`.

### Exercice 3 : conflictResolver (4 tests)

Implementez trois stratégies de résolution de conflits entre versions locale et distante :
- `client-wins` : la version locale gagne
- `server-wins` : la version distante gagne
- `merge` : fusion champ par champ (`Object.assign({}, remote.data, local.data)`)

Dans tous les cas, la version est incrementee a `max(local.version, remote.version) + 1`.

### Exercice 4 : createMigrationRunner (5 tests)

Creez un runner de migrations qui applique des transformations de donnees dans l'ordre (`up`) ou en sens inverse (`down`). Chaque migration à une version, une fonction `up` et une fonction `down`. Le runner garde trace de la version courante.

### Exercice 5 : createLRUCache (5 tests)

Implementez un cache LRU (Least Recently Used) avec une taille maximale. Quand le cache est plein, l'élément le moins recemment utilise est evince. `get` marque l'élément comme recemment utilise. `keys` retourne les clés dans l'ordre MRU -> LRU.

## Évaluation

- 22 tests au total
- Tous les tests doivent passer
- Les types TypeScript doivent etre corrects
