import {
  createTestRunner,
  assertEqual,
  assertDeepEqual,
  assertTrue,
  assertFalse,
  assertGreaterThan,
  assertLength,
} from '../test-utils.ts';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  staleTime: number;
}

interface QueryCache {
  get<T>(key: string): T | undefined;
  set<T>(key: string, data: T, staleTime?: number): void;
  has(key: string): boolean;
  isStale(key: string): boolean;
  invalidate(key: string): void;
  invalidatePrefix(prefix: string): void;
  gc(): number;
  size(): number;
  clear(): void;
}

interface QueryKeyFactory {
  all: () => readonly string[];
  lists: () => readonly string[];
  list: (filters: Record<string, unknown>) => readonly (string | Record<string, unknown>)[];
  details: () => readonly string[];
  detail: (id: number | string) => readonly (string | number)[];
}

interface Page<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

interface Paginator<T> {
  next(): Promise<Page<T>>;
  hasMore(): boolean;
  getAll(): T[];
  reset(): void;
  getCurrentCursor(): string | null;
}

// ─── Exercice 1 : createQueryCache ──────────────────────────────────────────

function createQueryCache(): QueryCache {
  const entries = new Map<string, CacheEntry<unknown>>();
  const DEFAULT_STALE_TIME = 300000; // 5 minutes

  return {
    get<T>(key: string): T | undefined {
      const entry = entries.get(key);
      return entry ? (entry.data as T) : undefined;
    },

    set<T>(key: string, data: T, staleTime: number = DEFAULT_STALE_TIME): void {
      entries.set(key, {
        data,
        timestamp: Date.now(),
        staleTime,
      });
    },

    has(key: string): boolean {
      return entries.has(key);
    },

    isStale(key: string): boolean {
      const entry = entries.get(key);
      if (!entry) return true;
      return Date.now() - entry.timestamp >= entry.staleTime;
    },

    invalidate(key: string): void {
      const entry = entries.get(key);
      if (entry) {
        entry.staleTime = 0;
      }
    },

    invalidatePrefix(prefix: string): void {
      for (const [key, entry] of entries) {
        if (key.startsWith(prefix)) {
          entry.staleTime = 0;
        }
      }
    },

    gc(): number {
      let removed = 0;
      for (const [key, entry] of entries) {
        if (Date.now() - entry.timestamp >= entry.staleTime) {
          entries.delete(key);
          removed++;
        }
      }
      return removed;
    },

    size(): number {
      return entries.size;
    },

    clear(): void {
      entries.clear();
    },
  };
}

// ─── Exercice 2 : createQueryKeyFactory ─────────────────────────────────────

function createQueryKeyFactory(entity: string): QueryKeyFactory {
  return {
    all: () => [entity] as const,
    lists: () => [entity, 'list'] as const,
    list: (filters: Record<string, unknown>) => [entity, 'list', filters] as const,
    details: () => [entity, 'detail'] as const,
    detail: (id: number | string) => [entity, 'detail', id] as const,
  };
}

// ─── Exercice 3 : optimisticUpdate ──────────────────────────────────────────

function optimisticUpdate<T>(
  cache: QueryCache,
  key: string,
  updater: (current: T | undefined) => T
): { rollback: () => void } {
  const previous = cache.get<T>(key);
  const hadKey = cache.has(key);

  const newData = updater(previous);
  cache.set(key, newData, 30000);

  return {
    rollback: () => {
      if (hadKey) {
        cache.set(key, previous, 60000);
      } else {
        cache.invalidate(key);
      }
    },
  };
}

// ─── Exercice 4 : createPaginator ───────────────────────────────────────────

function createPaginator<T>(
  fetchPage: (cursor: string | null) => Promise<Page<T>>
): Paginator<T> {
  let cursor: string | null = null;
  let hasMorePages = true;
  let buffer: T[] = [];
  let hasFetched = false;

  return {
    async next(): Promise<Page<T>> {
      if (hasFetched && !hasMorePages) {
        throw new Error('No more pages');
      }

      const page = await fetchPage(cursor);
      cursor = page.nextCursor;
      hasMorePages = page.hasMore;
      hasFetched = true;
      buffer = [...buffer, ...page.data];

      return page;
    },

    hasMore(): boolean {
      if (!hasFetched) return true;
      return hasMorePages;
    },

    getAll(): T[] {
      return [...buffer];
    },

    reset(): void {
      cursor = null;
      hasMorePages = true;
      hasFetched = false;
      buffer = [];
    },

    getCurrentCursor(): string | null {
      return cursor;
    },
  };
}

// ─── Exercice 5 : deduplicateRequests ───────────────────────────────────────

function deduplicateRequests(): {
  dedup: <T>(key: string, fn: () => Promise<T>) => Promise<T>;
  pending: () => number;
} {
  const inflight = new Map<string, Promise<unknown>>();

  return {
    dedup<T>(key: string, fn: () => Promise<T>): Promise<T> {
      const existing = inflight.get(key);
      if (existing) {
        return existing as Promise<T>;
      }

      const promise = fn().finally(() => {
        inflight.delete(key);
      });

      inflight.set(key, promise);
      return promise;
    },

    pending(): number {
      return inflight.size;
    },
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// TESTS
// ═════════════════════════════════════════════════════════════════════════════

const runner = createTestRunner('Lab 13 — React Query et cache');

// ─── Tests createQueryCache ─────────────────────────────────────────────────

runner.test('createQueryCache: set et get', () => {
  const cache = createQueryCache();
  cache.set('posts', [{ id: 1, title: 'Hello' }]);
  const data = cache.get<Array<{ id: number; title: string }>>('posts');
  assertLength(data!, 1);
  assertEqual(data![0].title, 'Hello');
});

runner.test('createQueryCache: get retourne undefined si absent', () => {
  const cache = createQueryCache();
  assertEqual(cache.get('nonexistent'), undefined);
});

runner.test('createQueryCache: has', () => {
  const cache = createQueryCache();
  assertFalse(cache.has('key'));
  cache.set('key', 'value');
  assertTrue(cache.has('key'));
});

runner.test('createQueryCache: isStale retourne false pour donnees fraiches', () => {
  const cache = createQueryCache();
  cache.set('key', 'value', 60000);
  assertFalse(cache.isStale('key'));
});

runner.test('createQueryCache: isStale retourne true pour cle inexistante', () => {
  const cache = createQueryCache();
  assertTrue(cache.isStale('nonexistent'));
});

runner.test('createQueryCache: invalidate marque comme stale', () => {
  const cache = createQueryCache();
  cache.set('key', 'value', 60000);
  assertFalse(cache.isStale('key'));
  cache.invalidate('key');
  assertTrue(cache.isStale('key'));
});

runner.test('createQueryCache: invalidatePrefix invalide les cles par prefixe', () => {
  const cache = createQueryCache();
  cache.set('posts:list', [1, 2, 3], 60000);
  cache.set('posts:detail:1', { id: 1 }, 60000);
  cache.set('users:list', ['a', 'b'], 60000);

  cache.invalidatePrefix('posts');

  assertTrue(cache.isStale('posts:list'));
  assertTrue(cache.isStale('posts:detail:1'));
  assertFalse(cache.isStale('users:list'));
});

runner.test('createQueryCache: gc supprime les entrees stale', () => {
  const cache = createQueryCache();
  cache.set('fresh', 'data', 60000);
  cache.set('stale1', 'data', 0);
  cache.set('stale2', 'data', 0);

  const removed = cache.gc();
  assertEqual(removed, 2);
  assertEqual(cache.size(), 1);
  assertTrue(cache.has('fresh'));
  assertFalse(cache.has('stale1'));
});

runner.test('createQueryCache: size et clear', () => {
  const cache = createQueryCache();
  cache.set('a', 1);
  cache.set('b', 2);
  cache.set('c', 3);
  assertEqual(cache.size(), 3);
  cache.clear();
  assertEqual(cache.size(), 0);
});

// ─── Tests createQueryKeyFactory ────────────────────────────────────────────

runner.test('createQueryKeyFactory: all retourne [entity]', () => {
  const keys = createQueryKeyFactory('posts');
  assertDeepEqual(keys.all(), ['posts']);
});

runner.test('createQueryKeyFactory: lists retourne [entity, "list"]', () => {
  const keys = createQueryKeyFactory('posts');
  assertDeepEqual(keys.lists(), ['posts', 'list']);
});

runner.test('createQueryKeyFactory: list avec filtres', () => {
  const keys = createQueryKeyFactory('posts');
  assertDeepEqual(keys.list({ page: 1, status: 'published' }), [
    'posts', 'list', { page: 1, status: 'published' },
  ]);
});

runner.test('createQueryKeyFactory: details retourne [entity, "detail"]', () => {
  const keys = createQueryKeyFactory('posts');
  assertDeepEqual(keys.details(), ['posts', 'detail']);
});

runner.test('createQueryKeyFactory: detail avec id', () => {
  const keys = createQueryKeyFactory('posts');
  assertDeepEqual(keys.detail(42), ['posts', 'detail', 42]);
});

runner.test('createQueryKeyFactory: detail avec id string', () => {
  const keys = createQueryKeyFactory('users');
  assertDeepEqual(keys.detail('abc-123'), ['users', 'detail', 'abc-123']);
});

// ─── Tests optimisticUpdate ─────────────────────────────────────────────────

runner.test('optimisticUpdate: met a jour le cache', () => {
  const cache = createQueryCache();
  cache.set('posts', [{ id: 1, likes: 0 }], 60000);

  optimisticUpdate(cache, 'posts', (current: any) =>
    current.map((p: any) => p.id === 1 ? { ...p, likes: 1 } : p)
  );

  const data = cache.get<Array<{ id: number; likes: number }>>('posts');
  assertEqual(data![0].likes, 1);
});

runner.test('optimisticUpdate: rollback restaure la valeur precedente', () => {
  const cache = createQueryCache();
  cache.set('posts', [{ id: 1, likes: 0 }], 60000);

  const { rollback } = optimisticUpdate(cache, 'posts', (current: any) =>
    current.map((p: any) => p.id === 1 ? { ...p, likes: 1 } : p)
  );

  assertEqual(cache.get<any>('posts')[0].likes, 1);

  rollback();

  assertEqual(cache.get<any>('posts')[0].likes, 0);
});

runner.test('optimisticUpdate: rollback sur cle inexistante supprime l\'entree', () => {
  const cache = createQueryCache();

  const { rollback } = optimisticUpdate(cache, 'new-key', () => 'new-value');

  assertTrue(cache.has('new-key'));
  assertEqual(cache.get('new-key'), 'new-value');

  rollback();
  cache.gc();

  assertFalse(cache.has('new-key'));
});

// ─── Tests createPaginator ──────────────────────────────────────────────────

runner.test('createPaginator: premiere page', async () => {
  const paginator = createPaginator(async (cursor) => {
    assertEqual(cursor, null);
    return {
      data: [{ id: 1 }, { id: 2 }],
      nextCursor: 'cursor-2',
      hasMore: true,
    };
  });

  assertTrue(paginator.hasMore());
  const page = await paginator.next();
  assertLength(page.data, 2);
  assertEqual(page.nextCursor, 'cursor-2');
  assertTrue(page.hasMore);
  assertEqual(paginator.getCurrentCursor(), 'cursor-2');
});

runner.test('createPaginator: pages multiples et accumulation', async () => {
  let callCount = 0;
  const paginator = createPaginator<{ id: number }>(async (cursor) => {
    callCount++;
    if (cursor === null) {
      return { data: [{ id: 1 }], nextCursor: 'c2', hasMore: true };
    }
    if (cursor === 'c2') {
      return { data: [{ id: 2 }], nextCursor: 'c3', hasMore: true };
    }
    return { data: [{ id: 3 }], nextCursor: null, hasMore: false };
  });

  await paginator.next();
  await paginator.next();
  await paginator.next();

  const all = paginator.getAll();
  assertLength(all, 3);
  assertEqual(all[0].id, 1);
  assertEqual(all[1].id, 2);
  assertEqual(all[2].id, 3);
  assertFalse(paginator.hasMore());
  assertEqual(callCount, 3);
});

runner.test('createPaginator: leve erreur si plus de pages', async () => {
  const paginator = createPaginator(async () => ({
    data: [1],
    nextCursor: null,
    hasMore: false,
  }));

  await paginator.next();
  assertFalse(paginator.hasMore());

  try {
    await paginator.next();
    assertTrue(false, 'Devrait avoir leve une erreur');
  } catch (err) {
    assertEqual((err as Error).message, 'No more pages');
  }
});

runner.test('createPaginator: reset reinitialise tout', async () => {
  let callCount = 0;
  const paginator = createPaginator(async () => {
    callCount++;
    return { data: [callCount], nextCursor: null, hasMore: false };
  });

  await paginator.next();
  assertLength(paginator.getAll(), 1);

  paginator.reset();
  assertTrue(paginator.hasMore());
  assertLength(paginator.getAll(), 0);
  assertEqual(paginator.getCurrentCursor(), null);

  await paginator.next();
  assertLength(paginator.getAll(), 1);
  assertEqual(callCount, 2);
});

// ─── Tests deduplicateRequests ──────────────────────────────────────────────

runner.test('deduplicateRequests: appels concurrents retournent la meme Promise', async () => {
  const { dedup, pending } = deduplicateRequests();
  let callCount = 0;

  const fn = async () => {
    callCount++;
    await new Promise(r => setTimeout(r, 50));
    return `result-${callCount}`;
  };

  const p1 = dedup('key', fn);
  const p2 = dedup('key', fn);
  const p3 = dedup('key', fn);

  assertEqual(pending(), 1);

  const [r1, r2, r3] = await Promise.all([p1, p2, p3]);

  assertEqual(callCount, 1);
  assertEqual(r1, r2);
  assertEqual(r2, r3);
  assertEqual(pending(), 0);
});

runner.test('deduplicateRequests: cles differentes lancent des requetes differentes', async () => {
  const { dedup, pending } = deduplicateRequests();
  let callCount = 0;

  const fn = async () => {
    callCount++;
    await new Promise(r => setTimeout(r, 10));
    return `result-${callCount}`;
  };

  const p1 = dedup('key-a', fn);
  const p2 = dedup('key-b', fn);

  assertEqual(pending(), 2);

  await Promise.all([p1, p2]);
  assertEqual(callCount, 2);
  assertEqual(pending(), 0);
});

runner.test('deduplicateRequests: cle liberee apres resolution', async () => {
  const { dedup } = deduplicateRequests();
  let callCount = 0;

  const fn = async () => {
    callCount++;
    return `result-${callCount}`;
  };

  const r1 = await dedup('key', fn);
  const r2 = await dedup('key', fn);

  assertEqual(callCount, 2);
  assertEqual(r1, 'result-1');
  assertEqual(r2, 'result-2');
});

runner.test('deduplicateRequests: cle liberee apres rejet', async () => {
  const { dedup, pending } = deduplicateRequests();
  let callCount = 0;

  try {
    await dedup('key', async () => {
      callCount++;
      throw new Error('fail');
    });
  } catch {
    // attendu
  }

  assertEqual(pending(), 0);

  const result = await dedup('key', async () => {
    callCount++;
    return 'ok';
  });

  assertEqual(callCount, 2);
  assertEqual(result, 'ok');
});

runner.run();
