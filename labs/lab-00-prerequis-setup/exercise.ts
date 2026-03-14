// ============================================================================
// LAB 00 — Prerequis TypeScript
// ============================================================================
// Objectif : valider vos connaissances TypeScript fondamentales
// Lancez avec : npx tsx labs/lab-00-prerequis-setup/exercise.ts
// ============================================================================

import {
  createTestRunner,
  assertEqual,
  assertDeepEqual,
  assertTrue,
  assertFalse,
  assertThrows,
} from '../test-utils.ts';

const runner = createTestRunner('Lab 00 — Prerequis TypeScript');

// ============================================================================
// Exercice 1 : parseQueryString
// ============================================================================
// Transforme une query string en objet cle/valeur.
// Exemple : "name=Alice&age=30&city=Paris" → { name: "Alice", age: "30", city: "Paris" }
// Si la string est vide, retourner un objet vide.
// Les cles sans valeur (ex: "active") doivent avoir la valeur "".
// Les valeurs doivent etre decodees avec decodeURIComponent.

function parseQueryString(_qs: string): Record<string, string> {
  // TODO: Implementer cette fonction
  throw new Error('Non implemente');
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
// Cree une version "debounced" d'une fonction.
// La fonction retournee attend `delay` ms apres le dernier appel avant d'executer.
// Chaque nouvel appel reset le timer.
// Retourne un objet { call, cancel, flush } :
// - call(...args) : appelle la fonction avec debounce
// - cancel() : annule l'appel en attente
// - flush() : execute immediatement s'il y a un appel en attente

interface DebouncedFn<T extends (...args: any[]) => void> {
  call: (...args: Parameters<T>) => void;
  cancel: () => void;
  flush: () => void;
}

function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): DebouncedFn<T> {
  // TODO: Implementer cette fonction
  throw new Error('Non implemente');
}

runner.test('debounce — appel apres delai', async () => {
  let result = '';
  const debounced = debounce((val: string) => { result = val; }, 50);
  debounced.call('hello');
  assertEqual(result, ''); // pas encore execute
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
// Clone en profondeur un objet (supporte objets, tableaux, dates, null, primitifs).
// NE PAS utiliser JSON.parse(JSON.stringify()) — les Date seraient converties en string.
// Les references circulaires ne sont pas a gerer.

function deepClone<T>(value: T): T {
  // TODO: Implementer cette fonction
  throw new Error('Non implemente');
}

runner.test('deepClone — objet simple', () => {
  const original = { name: 'Alice', age: 30 };
  const cloned = deepClone(original);
  assertDeepEqual(cloned, original);
  cloned.name = 'Bob';
  assertEqual(original.name, 'Alice'); // original non modifie
});

runner.test('deepClone — objet imbrique', () => {
  const original = { user: { name: 'Alice', scores: [10, 20] }, active: true };
  const cloned = deepClone(original);
  cloned.user.scores.push(30);
  assertEqual(original.user.scores.length, 2); // original non modifie
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
// Groupe les elements d'un tableau selon une fonction de cle.
// Exemple : groupBy([1,2,3,4,5], n => n % 2 === 0 ? 'pair' : 'impair')
//   → { impair: [1,3,5], pair: [2,4] }

function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  // TODO: Implementer cette fonction
  throw new Error('Non implemente');
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
// Cree une fonction qui compose des fonctions de gauche a droite.
// pipe(f, g, h)(x) === h(g(f(x)))

function pipe<T>(...fns: Array<(arg: T) => T>): (arg: T) => T {
  // TODO: Implementer cette fonction
  throw new Error('Non implemente');
}

runner.test('pipe — composition de fonctions', () => {
  const transform = pipe(
    (x: number) => x * 2,
    (x: number) => x + 10,
    (x: number) => x / 2,
  );
  assertEqual(transform(5), 10); // (5*2 + 10) / 2 = 10
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
// Execute une fonction async avec retry.
// Si la fonction echoue, reessayer jusqu'a `maxAttempts` fois.
// Retourne le resultat du premier succes ou leve la derniere erreur.

async function retry<T>(fn: () => Promise<T>, maxAttempts: number): Promise<T> {
  // TODO: Implementer cette fonction
  throw new Error('Non implemente');
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
// Implementer un emetteur d'evenements type-safe.

interface EventMap {
  [event: string]: unknown;
}

interface TypedEventEmitter<T extends EventMap> {
  on<K extends keyof T>(event: K, listener: (data: T[K]) => void): void;
  off<K extends keyof T>(event: K, listener: (data: T[K]) => void): void;
  emit<K extends keyof T>(event: K, data: T[K]): void;
}

function createEventEmitter<T extends EventMap>(): TypedEventEmitter<T> {
  // TODO: Implementer cette fonction
  throw new Error('Non implemente');
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
