// =============================================================================
// Lab 14 — Stockage local et offline-first (Exercice)
// =============================================================================
// Execution : npx tsx labs/lab-14-stockage-offline/exercise.ts
// =============================================================================

import {
  createTestRunner,
  assertEqual,
  assertDeepEqual,
  assertTrue,
  assertFalse,
  assertThrows,
  assertLength,
  assertGreaterThan,
  assertApprox,
} from '../test-utils.ts';

const { test, run } = createTestRunner('Lab 14 — Stockage local et offline-first');

// =============================================================================
// Types
// =============================================================================

interface QueueItem<T = unknown> {
  id: string;
  action: string;
  payload: T;
  timestamp: number;
  retryCount: number;
}

interface OfflineQueue<T = unknown> {
  enqueue: (action: string, payload: T) => string;
  dequeue: () => QueueItem<T> | null;
  peek: () => QueueItem<T> | null;
  size: () => number;
  flush: () => QueueItem<T>[];
}

type SyncStatus = 'idle' | 'syncing' | 'done' | 'error';

interface SyncResult {
  synced: number;
  failed: number;
  errors: string[];
}

interface SyncManager<T = unknown> {
  sync: () => Promise<SyncResult>;
  retry: (id: string) => Promise<boolean>;
  getStatus: () => SyncStatus;
}

interface VersionedRecord {
  id: string;
  data: Record<string, unknown>;
  updatedAt: number;
  version: number;
}

type ConflictStrategy = 'client-wins' | 'server-wins' | 'merge';

interface Migration {
  version: number;
  up: (data: Record<string, unknown>[]) => Record<string, unknown>[];
  down: (data: Record<string, unknown>[]) => Record<string, unknown>[];
}

interface MigrationRunner {
  up: () => Record<string, unknown>[];
  down: () => Record<string, unknown>[];
  getCurrentVersion: () => number;
}

interface LRUCache<T> {
  get: (key: string) => T | null;
  set: (key: string, value: T) => void;
  evict: (key: string) => boolean;
  size: () => number;
  keys: () => string[];
}

// =============================================================================
// Exercice 1 : createOfflineQueue
// Cree une queue FIFO pour les operations offline.
//
// createOfflineQueue<T>() -> OfflineQueue<T>
//
// - enqueue(action, payload) : ajoute un item, retourne son id (UUID simplifie)
// - dequeue() : retire et retourne le premier item, ou null si vide
// - peek() : retourne le premier item sans le retirer, ou null si vide
// - size() : nombre d'items dans la queue
// - flush() : retire et retourne tous les items (vide la queue)
//
// Chaque item a : id (string unique), action, payload, timestamp (Date.now()),
// retryCount (0 au depart).
// =============================================================================

// TODO: Implementez createOfflineQueue

// =============================================================================
// Exercice 2 : createSyncManager
// Cree un gestionnaire de synchronisation qui traite les items de la queue
// via une fonction API.
//
// createSyncManager<T>(queue, apiFn) -> SyncManager<T>
//
// - queue : une OfflineQueue
// - apiFn : (item: QueueItem<T>) => Promise<boolean>
//   Retourne true si l'envoi reussit, false sinon.
//
// sync() :
//   - Passe le statut a 'syncing'
//   - Traite TOUS les items de la queue (flush)
//   - Pour chaque item, appelle apiFn
//   - Si apiFn retourne true : l'item est synchronise (synced++)
//   - Si apiFn retourne false : l'item est en echec (failed++),
//     on incremente retryCount et on le remet dans la queue
//   - A la fin : statut 'done' si aucun echec, 'error' sinon
//   - Retourne { synced, failed, errors }
//
// retry(id) :
//   - Cherche l'item par id dans la queue (peek + dequeue si match)
//   - Appelle apiFn sur cet item
//   - Retourne le resultat de apiFn
//
// getStatus() : retourne le statut courant ('idle' au depart)
// =============================================================================

// TODO: Implementez createSyncManager

// =============================================================================
// Exercice 3 : conflictResolver
// Resout un conflit entre une version locale et une version distante
// selon la strategie choisie.
//
// conflictResolver(local, remote, strategy) -> VersionedRecord
//
// Strategies :
// - 'client-wins' : retourne local avec version = max(local.version, remote.version) + 1
// - 'server-wins' : retourne remote avec version = max(local.version, remote.version) + 1
// - 'merge' : fusionne les data (Object.assign({}, remote.data, local.data)),
//   prend le updatedAt le plus recent,
//   version = max(local.version, remote.version) + 1,
//   id = local.id
// =============================================================================

// TODO: Implementez conflictResolver

// =============================================================================
// Exercice 4 : createMigrationRunner
// Execute des migrations de donnees dans l'ordre (up) ou en sens inverse (down).
//
// createMigrationRunner(migrations, initialData?) -> MigrationRunner
//
// - migrations : tableau de Migration trie par version croissante
// - initialData : donnees initiales (defaut [])
//
// up() :
//   - Applique la migration suivante (version > currentVersion)
//   - Retourne les donnees apres migration
//   - Si deja a la derniere version, retourne les donnees telles quelles
//
// down() :
//   - Annule la derniere migration appliquee (version = currentVersion)
//   - Retourne les donnees apres rollback
//   - Si aucune migration appliquee (version 0), retourne les donnees telles quelles
//
// getCurrentVersion() : retourne la version courante (0 au depart)
// =============================================================================

// TODO: Implementez createMigrationRunner

// =============================================================================
// Exercice 5 : createLRUCache
// Cree un cache LRU (Least Recently Used) avec une taille maximale.
//
// createLRUCache<T>(maxSize) -> LRUCache<T>
//
// - get(key) : retourne la valeur ou null. Marque l'item comme recemment utilise.
// - set(key, value) : ajoute ou met a jour. Si le cache est plein,
//   evince l'item le moins recemment utilise.
// - evict(key) : supprime l'item, retourne true si existait, false sinon.
// - size() : nombre d'items.
// - keys() : retourne les cles dans l'ordre du plus recemment utilise
//   au moins recemment utilise.
// =============================================================================

// TODO: Implementez createLRUCache

// =============================================================================
// Tests
// =============================================================================

// --- Exercice 1 : createOfflineQueue ---

let idCounter = 0;

test('Ex1: enqueue ajoute un item et retourne un id', () => {
  const queue = createOfflineQueue<{ title: string }>();
  const id = queue.enqueue('CREATE', { title: 'Todo 1' });
  assertTrue(typeof id === 'string');
  assertGreaterThan(id.length, 0);
  assertEqual(queue.size(), 1);
});

test('Ex1: dequeue retourne le premier item (FIFO)', () => {
  const queue = createOfflineQueue<{ title: string }>();
  queue.enqueue('CREATE', { title: 'Premier' });
  queue.enqueue('CREATE', { title: 'Deuxieme' });

  const item = queue.dequeue();
  assertDeepEqual(item?.payload, { title: 'Premier' });
  assertEqual(item?.action, 'CREATE');
  assertEqual(item?.retryCount, 0);
  assertEqual(queue.size(), 1);
});

test('Ex1: dequeue retourne null si queue vide', () => {
  const queue = createOfflineQueue();
  const item = queue.dequeue();
  assertEqual(item, null);
});

test('Ex1: peek retourne le premier item sans le retirer', () => {
  const queue = createOfflineQueue<{ title: string }>();
  queue.enqueue('UPDATE', { title: 'Test' });

  const peeked = queue.peek();
  assertEqual(peeked?.action, 'UPDATE');
  assertEqual(queue.size(), 1); // Pas retire

  const dequeued = queue.dequeue();
  assertEqual(dequeued?.action, 'UPDATE');
  assertEqual(queue.size(), 0); // Maintenant retire
});

test('Ex1: flush vide la queue et retourne tous les items', () => {
  const queue = createOfflineQueue<string>();
  queue.enqueue('A', 'payload-a');
  queue.enqueue('B', 'payload-b');
  queue.enqueue('C', 'payload-c');

  const items = queue.flush();
  assertLength(items, 3);
  assertEqual(items[0].action, 'A');
  assertEqual(items[1].action, 'B');
  assertEqual(items[2].action, 'C');
  assertEqual(queue.size(), 0);
});

// --- Exercice 2 : createSyncManager ---

test('Ex2: sync traite tous les items avec succes', async () => {
  const queue = createOfflineQueue<string>();
  queue.enqueue('CREATE', 'item1');
  queue.enqueue('UPDATE', 'item2');

  const apiFn = async (_item: QueueItem<string>) => true;
  const manager = createSyncManager(queue, apiFn);

  assertEqual(manager.getStatus(), 'idle');
  const result = await manager.sync();

  assertEqual(result.synced, 2);
  assertEqual(result.failed, 0);
  assertLength(result.errors, 0);
  assertEqual(manager.getStatus(), 'done');
  assertEqual(queue.size(), 0);
});

test('Ex2: sync remet les items echoues dans la queue', async () => {
  const queue = createOfflineQueue<string>();
  queue.enqueue('CREATE', 'ok-item');
  queue.enqueue('CREATE', 'fail-item');

  const apiFn = async (item: QueueItem<string>) => {
    return item.payload !== 'fail-item';
  };
  const manager = createSyncManager(queue, apiFn);

  const result = await manager.sync();
  assertEqual(result.synced, 1);
  assertEqual(result.failed, 1);
  assertEqual(manager.getStatus(), 'error');
  assertEqual(queue.size(), 1); // L'item echoue est remis

  const retried = queue.peek();
  assertEqual(retried?.payload, 'fail-item');
  assertEqual(retried?.retryCount, 1);
});

test('Ex2: getStatus retourne idle au depart', () => {
  const queue = createOfflineQueue();
  const manager = createSyncManager(queue, async () => true);
  assertEqual(manager.getStatus(), 'idle');
});

// --- Exercice 3 : conflictResolver ---

test('Ex3: client-wins retourne la version locale', () => {
  const local: VersionedRecord = {
    id: '1', data: { title: 'Local title', done: true }, updatedAt: 1000, version: 3,
  };
  const remote: VersionedRecord = {
    id: '1', data: { title: 'Remote title', done: false }, updatedAt: 900, version: 4,
  };

  const resolved = conflictResolver(local, remote, 'client-wins');
  assertEqual(resolved.data.title, 'Local title');
  assertEqual(resolved.data.done, true);
  assertEqual(resolved.version, 5); // max(3,4) + 1
  assertEqual(resolved.id, '1');
});

test('Ex3: server-wins retourne la version distante', () => {
  const local: VersionedRecord = {
    id: '1', data: { title: 'Local' }, updatedAt: 1000, version: 2,
  };
  const remote: VersionedRecord = {
    id: '1', data: { title: 'Remote' }, updatedAt: 900, version: 5,
  };

  const resolved = conflictResolver(local, remote, 'server-wins');
  assertEqual(resolved.data.title, 'Remote');
  assertEqual(resolved.version, 6); // max(2,5) + 1
});

test('Ex3: merge fusionne les deux versions', () => {
  const local: VersionedRecord = {
    id: '1',
    data: { title: 'Local title', localOnly: true },
    updatedAt: 1000,
    version: 3,
  };
  const remote: VersionedRecord = {
    id: '1',
    data: { title: 'Remote title', remoteOnly: 42 },
    updatedAt: 1200,
    version: 4,
  };

  const resolved = conflictResolver(local, remote, 'merge');
  // local.data ecrase remote.data (Object.assign({}, remote.data, local.data))
  assertEqual(resolved.data.title, 'Local title');
  assertEqual(resolved.data.localOnly, true);
  assertEqual(resolved.data.remoteOnly, 42);
  assertEqual(resolved.updatedAt, 1200); // Le plus recent
  assertEqual(resolved.version, 5);
  assertEqual(resolved.id, '1');
});

test('Ex3: merge prend le updatedAt le plus recent', () => {
  const local: VersionedRecord = {
    id: '2', data: { a: 1 }, updatedAt: 500, version: 1,
  };
  const remote: VersionedRecord = {
    id: '2', data: { b: 2 }, updatedAt: 300, version: 1,
  };

  const resolved = conflictResolver(local, remote, 'merge');
  assertEqual(resolved.updatedAt, 500);
});

// --- Exercice 4 : createMigrationRunner ---

test('Ex4: up applique la premiere migration', () => {
  const migrations: Migration[] = [
    {
      version: 1,
      up: (data) => data.map((d) => ({ ...d, active: true })),
      down: (data) => data.map((d) => { const { active, ...rest } = d; return rest; }),
    },
  ];

  const runner = createMigrationRunner(migrations, [{ id: 1, name: 'Alice' }]);
  assertEqual(runner.getCurrentVersion(), 0);

  const result = runner.up();
  assertEqual(runner.getCurrentVersion(), 1);
  assertDeepEqual(result, [{ id: 1, name: 'Alice', active: true }]);
});

test('Ex4: down annule la derniere migration', () => {
  const migrations: Migration[] = [
    {
      version: 1,
      up: (data) => data.map((d) => ({ ...d, active: true })),
      down: (data) => data.map((d) => { const { active, ...rest } = d; return rest; }),
    },
  ];

  const runner = createMigrationRunner(migrations, [{ id: 1, name: 'Bob' }]);
  runner.up(); // version 1
  assertEqual(runner.getCurrentVersion(), 1);

  const result = runner.down();
  assertEqual(runner.getCurrentVersion(), 0);
  assertDeepEqual(result, [{ id: 1, name: 'Bob' }]);
});

test('Ex4: up successive applique les migrations dans l ordre', () => {
  const migrations: Migration[] = [
    {
      version: 1,
      up: (data) => data.map((d) => ({ ...d, v1: true })),
      down: (data) => data.map((d) => { const { v1, ...rest } = d; return rest; }),
    },
    {
      version: 2,
      up: (data) => data.map((d) => ({ ...d, v2: true })),
      down: (data) => data.map((d) => { const { v2, ...rest } = d; return rest; }),
    },
  ];

  const runner = createMigrationRunner(migrations, [{ id: 1 }]);
  runner.up(); // version 1
  const result = runner.up(); // version 2
  assertEqual(runner.getCurrentVersion(), 2);
  assertDeepEqual(result, [{ id: 1, v1: true, v2: true }]);
});

test('Ex4: up quand deja a la derniere version retourne les donnees', () => {
  const migrations: Migration[] = [
    {
      version: 1,
      up: (data) => data.map((d) => ({ ...d, migrated: true })),
      down: (data) => data.map((d) => { const { migrated, ...rest } = d; return rest; }),
    },
  ];

  const runner = createMigrationRunner(migrations, [{ id: 1 }]);
  runner.up();
  const result = runner.up(); // Deja a la derniere version
  assertEqual(runner.getCurrentVersion(), 1);
  assertDeepEqual(result, [{ id: 1, migrated: true }]);
});

test('Ex4: down quand aucune migration retourne les donnees', () => {
  const migrations: Migration[] = [
    {
      version: 1,
      up: (data) => data.map((d) => ({ ...d, extra: 1 })),
      down: (data) => data.map((d) => { const { extra, ...rest } = d; return rest; }),
    },
  ];

  const runner = createMigrationRunner(migrations, [{ id: 1 }]);
  const result = runner.down(); // Rien a annuler
  assertEqual(runner.getCurrentVersion(), 0);
  assertDeepEqual(result, [{ id: 1 }]);
});

// --- Exercice 5 : createLRUCache ---

test('Ex5: set et get fonctionnent', () => {
  const cache = createLRUCache<string>(3);
  cache.set('a', 'alpha');
  cache.set('b', 'beta');

  assertEqual(cache.get('a'), 'alpha');
  assertEqual(cache.get('b'), 'beta');
  assertEqual(cache.get('c'), null);
  assertEqual(cache.size(), 2);
});

test('Ex5: eviction quand le cache est plein', () => {
  const cache = createLRUCache<number>(2);
  cache.set('a', 1);
  cache.set('b', 2);
  cache.set('c', 3); // Evince 'a' (LRU)

  assertEqual(cache.get('a'), null);
  assertEqual(cache.get('b'), 2);
  assertEqual(cache.get('c'), 3);
  assertEqual(cache.size(), 2);
});

test('Ex5: get marque comme recemment utilise', () => {
  const cache = createLRUCache<number>(2);
  cache.set('a', 1);
  cache.set('b', 2);

  cache.get('a'); // 'a' devient le plus recent

  cache.set('c', 3); // Evince 'b' (maintenant LRU)
  assertEqual(cache.get('a'), 1); // 'a' est encore la
  assertEqual(cache.get('b'), null); // 'b' a ete evince
  assertEqual(cache.get('c'), 3);
});

test('Ex5: evict supprime un item', () => {
  const cache = createLRUCache<string>(5);
  cache.set('x', 'hello');
  assertTrue(cache.evict('x'));
  assertEqual(cache.get('x'), null);
  assertFalse(cache.evict('x')); // Deja supprime
  assertEqual(cache.size(), 0);
});

test('Ex5: keys retourne dans l ordre MRU -> LRU', () => {
  const cache = createLRUCache<number>(5);
  cache.set('a', 1);
  cache.set('b', 2);
  cache.set('c', 3);
  cache.get('a'); // 'a' devient MRU

  const k = cache.keys();
  assertEqual(k[0], 'a'); // Plus recent
  assertEqual(k[1], 'c');
  assertEqual(k[2], 'b'); // Moins recent
});

// =============================================================================
// Lancement
// =============================================================================

run();
