// ─── Lab 03 — State et cycle de vie ─────────────────────────────────────────
// Objectifs : simuler useState/useReducer, creer un store reactif,
// implementer un debouncer, des updates immutables, et un lifecycle tracker.
//
// Lancer : npx tsx labs/lab-03-state-cycle-de-vie/exercise.ts
// ─────────────────────────────────────────────────────────────────────────────

import {
  createTestRunner,
  assertEqual,
  assertDeepEqual,
  assertTrue,
  assertFalse,
  assertThrows,
} from '../test-utils.ts';

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

/** Store reactif simplifie */
export interface Store<T> {
  getState: () => T;
  setState: (partial: Partial<T> | ((state: T) => Partial<T>)) => void;
  subscribe: (listener: (state: T) => void) => () => void;
  getSubscriberCount: () => number;
}

/** Action pour le reducer */
export interface Action<T extends string = string> {
  type: T;
  payload?: unknown;
}

/** Reducer generique */
export type Reducer<S, A extends Action> = (state: S, action: A) => S;

/** Resultat de useReducer simule */
export interface ReducerStore<S, A extends Action> {
  getState: () => S;
  dispatch: (action: A) => void;
  subscribe: (listener: (state: S) => void) => () => void;
}

/** Debouncer */
export interface Debouncer<T extends (...args: any[]) => void> {
  call: (...args: Parameters<T>) => void;
  cancel: () => void;
  flush: () => void;
  getCallCount: () => number;
  getPendingCount: () => number;
}

/** Evenement du cycle de vie */
export interface LifecycleEvent {
  type: 'mount' | 'update' | 'unmount';
  timestamp: number;
  data?: Record<string, unknown>;
}

/** Tracker de cycle de vie */
export interface LifecycleTracker {
  mount: (data?: Record<string, unknown>) => void;
  update: (data?: Record<string, unknown>) => void;
  unmount: (data?: Record<string, unknown>) => void;
  getEvents: () => LifecycleEvent[];
  getEventsByType: (type: LifecycleEvent['type']) => LifecycleEvent[];
  isMounted: () => boolean;
  getMountCount: () => number;
  reset: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Exercice 1 : createStore
// ═══════════════════════════════════════════════════════════════════════════════
// Cree un store reactif avec :
// - getState() : retourne l'etat courant
// - setState(partial) : fusionne un objet partiel dans l'etat
//   - Accepte un objet partiel OU une fonction (state) => Partial<T>
//   - Notifie tous les subscribers apres la mise a jour
// - subscribe(listener) : enregistre un listener, retourne une fn unsubscribe
// - getSubscriberCount() : nombre de subscribers actifs

export function createStore<T extends Record<string, unknown>>(initialState: T): Store<T> {
  // TODO: implementer
  throw new Error('Not implemented');
}

// ═══════════════════════════════════════════════════════════════════════════════
// Exercice 2 : createReducerStore (simulation de useReducer)
// ═══════════════════════════════════════════════════════════════════════════════
// Cree un store base sur un reducer :
// - getState() : retourne l'etat courant
// - dispatch(action) : applique le reducer et notifie les subscribers
// - subscribe(listener) : enregistre un listener, retourne une fn unsubscribe

export function createReducerStore<S, A extends Action>(
  reducer: Reducer<S, A>,
  initialState: S,
): ReducerStore<S, A> {
  // TODO: implementer
  throw new Error('Not implemented');
}

// ═══════════════════════════════════════════════════════════════════════════════
// Exercice 3 : createDebouncer
// ═══════════════════════════════════════════════════════════════════════════════
// Cree un debouncer qui :
// - call(...args) : planifie l'execution de fn apres delay ms
//   - Si appele avant que le delay soit ecoule, annule le precedent
// - cancel() : annule l'execution en attente
// - flush() : execute immediatement si une execution est en attente
// - getCallCount() : nombre de fois que fn a reellement ete executee
// - getPendingCount() : 1 si une execution est en attente, 0 sinon
//
// Note : utiliser setTimeout/clearTimeout

export function createDebouncer<T extends (...args: any[]) => void>(
  fn: T,
  delay: number,
): Debouncer<T> {
  // TODO: implementer
  throw new Error('Not implemented');
}

// ═══════════════════════════════════════════════════════════════════════════════
// Exercice 4 : immutableUpdate
// ═══════════════════════════════════════════════════════════════════════════════
// Met a jour une valeur dans un objet imbrique de maniere immutable.
// Le chemin est un tableau de cles (string ou number).
//
// Exemples :
//   immutableUpdate({ a: { b: 1 } }, ['a', 'b'], 2)
//     => { a: { b: 2 } }
//   immutableUpdate({ users: [{ name: 'Alice' }] }, ['users', 0, 'name'], 'Bob')
//     => { users: [{ name: 'Bob' }] }
//
// IMPORTANT : ne pas muter l'objet original !

export function immutableUpdate(
  obj: Record<string, unknown>,
  path: (string | number)[],
  value: unknown,
): Record<string, unknown> {
  // TODO: implementer
  throw new Error('Not implemented');
}

// ═══════════════════════════════════════════════════════════════════════════════
// Exercice 5 : createLifecycleTracker
// ═══════════════════════════════════════════════════════════════════════════════
// Cree un tracker qui enregistre les evenements mount/update/unmount :
// - mount(data?) : enregistre un evenement mount (doit etre le premier appel ou apres unmount)
// - update(data?) : enregistre un evenement update (doit etre monte)
// - unmount(data?) : enregistre un evenement unmount (doit etre monte)
// - getEvents() : retourne tous les evenements
// - getEventsByType(type) : filtre par type
// - isMounted() : true si monte et pas demonte
// - getMountCount() : nombre total de montages
// - reset() : vide tout et remet isMounted a false

export function createLifecycleTracker(): LifecycleTracker {
  // TODO: implementer
  throw new Error('Not implemented');
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════════

const runner = createTestRunner('Lab 03 — State et cycle de vie');

// ─── createStore ────────────────────────────────────────────────────────────

runner.test('Store: getState retourne l\'etat initial', () => {
  const store = createStore({ count: 0, name: 'test' });
  assertDeepEqual(store.getState(), { count: 0, name: 'test' });
});

runner.test('Store: setState avec objet partiel', () => {
  const store = createStore({ count: 0, name: 'test' });
  store.setState({ count: 5 });
  assertEqual(store.getState().count, 5);
  assertEqual(store.getState().name, 'test');
});

runner.test('Store: setState avec fonction', () => {
  const store = createStore({ count: 10 });
  store.setState(state => ({ count: state.count + 5 }));
  assertEqual(store.getState().count, 15);
});

runner.test('Store: subscribe notifie les listeners', () => {
  const store = createStore({ value: 0 });
  const values: number[] = [];
  store.subscribe(state => values.push(state.value));
  store.setState({ value: 1 });
  store.setState({ value: 2 });
  assertDeepEqual(values, [1, 2]);
});

runner.test('Store: unsubscribe arrete les notifications', () => {
  const store = createStore({ value: 0 });
  const values: number[] = [];
  const unsub = store.subscribe(state => values.push(state.value));
  store.setState({ value: 1 });
  unsub();
  store.setState({ value: 2 });
  assertDeepEqual(values, [1]);
});

runner.test('Store: getSubscriberCount', () => {
  const store = createStore({ x: 0 });
  assertEqual(store.getSubscriberCount(), 0);
  const unsub1 = store.subscribe(() => {});
  const unsub2 = store.subscribe(() => {});
  assertEqual(store.getSubscriberCount(), 2);
  unsub1();
  assertEqual(store.getSubscriberCount(), 1);
});

// ─── createReducerStore ─────────────────────────────────────────────────────

runner.test('ReducerStore: dispatch applique le reducer', () => {
  type CounterAction =
    | Action<'INCREMENT'>
    | Action<'DECREMENT'>
    | { type: 'SET'; payload: number };

  const reducer: Reducer<{ count: number }, CounterAction> = (state, action) => {
    switch (action.type) {
      case 'INCREMENT': return { count: state.count + 1 };
      case 'DECREMENT': return { count: state.count - 1 };
      case 'SET': return { count: action.payload as number };
      default: return state;
    }
  };

  const store = createReducerStore(reducer, { count: 0 });
  store.dispatch({ type: 'INCREMENT' });
  store.dispatch({ type: 'INCREMENT' });
  store.dispatch({ type: 'DECREMENT' });
  assertEqual(store.getState().count, 1);
});

runner.test('ReducerStore: subscribe notifie apres dispatch', () => {
  type TodoAction =
    | { type: 'ADD'; payload: string }
    | { type: 'CLEAR' };

  const reducer: Reducer<{ items: string[] }, TodoAction> = (state, action) => {
    switch (action.type) {
      case 'ADD': return { items: [...state.items, action.payload as string] };
      case 'CLEAR': return { items: [] };
      default: return state;
    }
  };

  const store = createReducerStore(reducer, { items: [] });
  const snapshots: string[][] = [];
  store.subscribe(state => snapshots.push([...state.items]));

  store.dispatch({ type: 'ADD', payload: 'a' });
  store.dispatch({ type: 'ADD', payload: 'b' });
  store.dispatch({ type: 'CLEAR' });

  assertDeepEqual(snapshots, [['a'], ['a', 'b'], []]);
});

// ─── createDebouncer ────────────────────────────────────────────────────────

runner.test('Debouncer: call execute apres le delay', async () => {
  let result = '';
  const debounced = createDebouncer((val: string) => { result = val; }, 50);
  debounced.call('hello');
  assertEqual(result, ''); // Pas encore execute
  await new Promise(r => setTimeout(r, 80));
  assertEqual(result, 'hello');
  assertEqual(debounced.getCallCount(), 1);
});

runner.test('Debouncer: appels multiples n\'executent que le dernier', async () => {
  const calls: string[] = [];
  const debounced = createDebouncer((val: string) => { calls.push(val); }, 50);
  debounced.call('a');
  debounced.call('b');
  debounced.call('c');
  await new Promise(r => setTimeout(r, 80));
  assertDeepEqual(calls, ['c']);
  assertEqual(debounced.getCallCount(), 1);
});

runner.test('Debouncer: cancel annule l\'execution', async () => {
  let called = false;
  const debounced = createDebouncer(() => { called = true; }, 50);
  debounced.call();
  assertEqual(debounced.getPendingCount(), 1);
  debounced.cancel();
  assertEqual(debounced.getPendingCount(), 0);
  await new Promise(r => setTimeout(r, 80));
  assertFalse(called);
});

runner.test('Debouncer: flush execute immediatement', () => {
  let result = 0;
  const debounced = createDebouncer((n: number) => { result = n; }, 5000);
  debounced.call(42);
  assertEqual(result, 0);
  debounced.flush();
  assertEqual(result, 42);
  assertEqual(debounced.getCallCount(), 1);
  assertEqual(debounced.getPendingCount(), 0);
});

// ─── immutableUpdate ────────────────────────────────────────────────────────

runner.test('immutableUpdate: met a jour une propriete de premier niveau', () => {
  const original = { name: 'Alice', age: 30 };
  const updated = immutableUpdate(original, ['age'], 31);
  assertEqual((updated as any).age, 31);
  assertEqual((updated as any).name, 'Alice');
  // L'original n'a pas ete mute
  assertEqual((original as any).age, 30);
});

runner.test('immutableUpdate: met a jour une propriete imbriquee', () => {
  const original = { user: { address: { city: 'Paris' } } };
  const updated = immutableUpdate(original, ['user', 'address', 'city'], 'Lyon');
  assertEqual((updated as any).user.address.city, 'Lyon');
  // L'original n'a pas ete mute
  assertEqual((original as any).user.address.city, 'Paris');
});

runner.test('immutableUpdate: met a jour un element de tableau', () => {
  const original = { items: ['a', 'b', 'c'] };
  const updated = immutableUpdate(original, ['items', 1], 'B');
  assertDeepEqual((updated as any).items, ['a', 'B', 'c']);
  // L'original n'a pas ete mute
  assertDeepEqual((original as any).items, ['a', 'b', 'c']);
});

runner.test('immutableUpdate: chemin profond avec tableau', () => {
  const original = { users: [{ name: 'Alice', scores: [10, 20] }] };
  const updated = immutableUpdate(original, ['users', 0, 'scores', 1], 25);
  assertEqual((updated as any).users[0].scores[1], 25);
  // L'original n'a pas ete mute
  assertEqual((original as any).users[0].scores[1], 20);
});

// ─── createLifecycleTracker ─────────────────────────────────────────────────

runner.test('LifecycleTracker: mount enregistre un evenement', () => {
  const tracker = createLifecycleTracker();
  tracker.mount({ component: 'App' });
  assertTrue(tracker.isMounted());
  assertEqual(tracker.getEvents().length, 1);
  assertEqual(tracker.getEvents()[0].type, 'mount');
});

runner.test('LifecycleTracker: update necessite un mount prealable', () => {
  const tracker = createLifecycleTracker();
  assertThrows(() => tracker.update());
  tracker.mount();
  tracker.update({ reason: 'props changed' }); // OK
  assertEqual(tracker.getEventsByType('update').length, 1);
});

runner.test('LifecycleTracker: unmount remet isMounted a false', () => {
  const tracker = createLifecycleTracker();
  tracker.mount();
  assertTrue(tracker.isMounted());
  tracker.unmount();
  assertFalse(tracker.isMounted());
});

runner.test('LifecycleTracker: getMountCount apres plusieurs cycles', () => {
  const tracker = createLifecycleTracker();
  tracker.mount();
  tracker.unmount();
  tracker.mount();
  tracker.update();
  tracker.unmount();
  tracker.mount();
  assertEqual(tracker.getMountCount(), 3);
});

runner.test('LifecycleTracker: reset vide tout', () => {
  const tracker = createLifecycleTracker();
  tracker.mount();
  tracker.update();
  tracker.reset();
  assertFalse(tracker.isMounted());
  assertEqual(tracker.getEvents().length, 0);
  assertEqual(tracker.getMountCount(), 0);
});

// ─── Run ────────────────────────────────────────────────────────────────────

runner.run();
