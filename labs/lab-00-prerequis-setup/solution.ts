// ============================================================================
// LAB 00 — Prerequis TypeScript — SOLUTIONS
// ============================================================================
// Lancez avec : npx tsx labs/lab-00-prerequis-setup/solution.ts
// ============================================================================

import {
  createTestRunner,
  assertEqual,
  assertDeepEqual,
  assertTrue,
  assertFalse,
  assertThrows,
} from '../test-utils.ts';

const runner = createTestRunner('Lab 00 — Prerequis TypeScript (Solutions)');

// ============================================================================
// Exercice 1 : parseQueryString
// ============================================================================

function parseQueryString(qs: string): Record<string, string> {
  if (qs === '') return {};

  const result: Record<string, string> = {};

  for (const pair of qs.split('&')) {
    const eqIndex = pair.indexOf('=');
    if (eqIndex === -1) {
      result[decodeURIComponent(pair)] = '';
    } else {
      const key = decodeURIComponent(pair.slice(0, eqIndex));
      const value = decodeURIComponent(pair.slice(eqIndex + 1));
      result[key] = value;
    }
  }

  return result;
}

runner.test('parseQueryString — parametres simples', () => {
  assertDeepEqual(
    parseQueryString('name=Alice&age=30&city=Paris'),
    { name: 'Alice', age: '30', city: 'Paris' },
  );
});

runner.test('parseQueryString — string vide', () => {
  assertDeepEqual(parseQueryString(''), {});
});

runner.test('parseQueryString — cle sans valeur', () => {
  assertDeepEqual(
    parseQueryString('active&name=Bob'),
    { active: '', name: 'Bob' },
  );
});

runner.test('parseQueryString — valeurs encodees', () => {
  assertDeepEqual(
    parseQueryString('message=hello%20world&path=%2Fhome%2Fuser'),
    { message: 'hello world', path: '/home/user' },
  );
});

// ============================================================================
// Exercice 2 : debounce
// ============================================================================

interface DebouncedFn<T extends (...args: any[]) => void> {
  call: (...args: Parameters<T>) => void;
  cancel: () => void;
  flush: () => void;
}

function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): DebouncedFn<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pendingArgs: Parameters<T> | null = null;

  const cancel = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    pendingArgs = null;
  };

  const flush = () => {
    if (timer !== null && pendingArgs !== null) {
      clearTimeout(timer);
      timer = null;
      const args = pendingArgs;
      pendingArgs = null;
      fn(...args);
    }
  };

  const call = (...args: Parameters<T>) => {
    if (timer !== null) {
      clearTimeout(timer);
    }
    pendingArgs = args;
    timer = setTimeout(() => {
      timer = null;
      const a = pendingArgs;
      pendingArgs = null;
      if (a !== null) fn(...a);
    }, delay);
  };

  return { call, cancel, flush };
}

runner.test('debounce — appel apres delai', async () => {
  let result = '';
  const debounced = debounce((val: string) => { result = val; }, 50);
  debounced.call('hello');
  assertEqual(result, '');
  await new Promise(r => setTimeout(r, 80));
  assertEqual(result, 'hello');
});

runner.test('debounce — cancel annule l\'appel', async () => {
  let count = 0;
  const debounced = debounce(() => { count++; }, 50);
  debounced.call();
  debounced.cancel();
  await new Promise(r => setTimeout(r, 80));
  assertEqual(count, 0);
});

runner.test('debounce — flush execute immediatement', () => {
  let result = '';
  const debounced = debounce((val: string) => { result = val; }, 5000);
  debounced.call('flushed');
  debounced.flush();
  assertEqual(result, 'flushed');
});

// ============================================================================
// Exercice 3 : deepClone
// ============================================================================

function deepClone<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (value instanceof Date) {
    return new Date(value.getTime()) as unknown as T;
  }

  if (Array.isArray(value)) {
    return value.map(item => deepClone(item)) as unknown as T;
  }

  const cloned: Record<string, unknown> = {};
  for (const key of Object.keys(value as Record<string, unknown>)) {
    cloned[key] = deepClone((value as Record<string, unknown>)[key]);
  }
  return cloned as T;
}

runner.test('deepClone — objet simple', () => {
  const original = { name: 'Alice', age: 30 };
  const cloned = deepClone(original);
  assertDeepEqual(cloned, original);
  cloned.name = 'Bob';
  assertEqual(original.name, 'Alice');
});

runner.test('deepClone — objet imbrique', () => {
  const original = { user: { name: 'Alice', scores: [10, 20] }, active: true };
  const cloned = deepClone(original);
  cloned.user.scores.push(30);
  assertEqual(original.user.scores.length, 2);
});

runner.test('deepClone — Date', () => {
  const original = { createdAt: new Date('2025-01-15') };
  const cloned = deepClone(original);
  assertTrue(cloned.createdAt instanceof Date);
  assertEqual(cloned.createdAt.getTime(), original.createdAt.getTime());
});

// ============================================================================
// Exercice 4 : groupBy
// ============================================================================

function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  const result: Record<string, T[]> = {};

  for (const item of items) {
    const key = keyFn(item);
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(item);
  }

  return result;
}

runner.test('groupBy — nombres pairs/impairs', () => {
  const result = groupBy([1, 2, 3, 4, 5], n => n % 2 === 0 ? 'pair' : 'impair');
  assertDeepEqual(result, { impair: [1, 3, 5], pair: [2, 4] });
});

runner.test('groupBy — objets par propriete', () => {
  const users = [
    { name: 'Alice', role: 'admin' },
    { name: 'Bob', role: 'user' },
    { name: 'Claire', role: 'admin' },
    { name: 'David', role: 'user' },
  ];
  const result = groupBy(users, u => u.role);
  assertEqual(result.admin.length, 2);
  assertEqual(result.user.length, 2);
  assertEqual(result.admin[0].name, 'Alice');
});

runner.test('groupBy — tableau vide', () => {
  assertDeepEqual(groupBy([], () => 'x'), {});
});

// ============================================================================
// Exercice 5 : pipe
// ============================================================================

function pipe<T>(...fns: Array<(arg: T) => T>): (arg: T) => T {
  return (arg: T) => fns.reduce((acc, fn) => fn(acc), arg);
}

runner.test('pipe — composition de fonctions', () => {
  const transform = pipe(
    (x: number) => x * 2,
    (x: number) => x + 10,
    (x: number) => x / 2,
  );
  assertEqual(transform(5), 10);
});

runner.test('pipe — une seule fonction', () => {
  const identity = pipe((x: string) => x.toUpperCase());
  assertEqual(identity('hello'), 'HELLO');
});

runner.test('pipe — zero fonctions (identite)', () => {
  const identity = pipe<number>();
  assertEqual(identity(42), 42);
});

// ============================================================================
// Exercice 6 : retry (async)
// ============================================================================

async function retry<T>(fn: () => Promise<T>, maxAttempts: number): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }

  throw lastError;
}

runner.test('retry — succes au premier essai', async () => {
  const result = await retry(() => Promise.resolve(42), 3);
  assertEqual(result, 42);
});

runner.test('retry — succes apres echecs', async () => {
  let attempts = 0;
  const result = await retry(async () => {
    attempts++;
    if (attempts < 3) throw new Error('fail');
    return 'success';
  }, 5);
  assertEqual(result, 'success');
  assertEqual(attempts, 3);
});

runner.test('retry — echec apres tous les essais', async () => {
  let attempts = 0;
  try {
    await retry(async () => {
      attempts++;
      throw new Error('always fails');
    }, 3);
    throw new Error('Should have thrown');
  } catch (e) {
    assertEqual((e as Error).message, 'always fails');
    assertEqual(attempts, 3);
  }
});

// ============================================================================
// Exercice 7 : EventEmitter (generics avance)
// ============================================================================

interface EventMap {
  [event: string]: unknown;
}

interface TypedEventEmitter<T extends EventMap> {
  on<K extends keyof T>(event: K, listener: (data: T[K]) => void): void;
  off<K extends keyof T>(event: K, listener: (data: T[K]) => void): void;
  emit<K extends keyof T>(event: K, data: T[K]): void;
}

function createEventEmitter<T extends EventMap>(): TypedEventEmitter<T> {
  const listeners = new Map<keyof T, Set<(data: any) => void>>();

  return {
    on<K extends keyof T>(event: K, listener: (data: T[K]) => void) {
      if (!listeners.has(event)) {
        listeners.set(event, new Set());
      }
      listeners.get(event)!.add(listener as (data: any) => void);
    },

    off<K extends keyof T>(event: K, listener: (data: T[K]) => void) {
      listeners.get(event)?.delete(listener as (data: any) => void);
    },

    emit<K extends keyof T>(event: K, data: T[K]) {
      listeners.get(event)?.forEach(fn => fn(data));
    },
  };
}

runner.test('EventEmitter — on et emit', () => {
  interface Events { greet: string; count: number; }
  const emitter = createEventEmitter<Events>();
  let received = '';
  emitter.on('greet', (msg) => { received = msg; });
  emitter.emit('greet', 'hello');
  assertEqual(received, 'hello');
});

runner.test('EventEmitter — off supprime le listener', () => {
  interface Events { tick: number; }
  const emitter = createEventEmitter<Events>();
  let count = 0;
  const listener = () => { count++; };
  emitter.on('tick', listener);
  emitter.emit('tick', 1);
  emitter.off('tick', listener);
  emitter.emit('tick', 2);
  assertEqual(count, 1);
});

runner.test('EventEmitter — multiple listeners', () => {
  interface Events { data: string; }
  const emitter = createEventEmitter<Events>();
  const results: string[] = [];
  emitter.on('data', (d) => results.push(`A:${d}`));
  emitter.on('data', (d) => results.push(`B:${d}`));
  emitter.emit('data', 'test');
  assertDeepEqual(results, ['A:test', 'B:test']);
});

// ============================================================================
runner.run();
