// ─── Lab 03 — State et cycle de vie (Solution) ──────────────────────────────
// Lancer : npx tsx labs/lab-03-state-cycle-de-vie/solution.ts
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

export interface Store<T> {
  getState: () => T;
  setState: (partial: Partial<T> | ((state: T) => Partial<T>)) => void;
  subscribe: (listener: (state: T) => void) => () => void;
  getSubscriberCount: () => number;
}

export interface Action<T extends string = string> {
  type: T;
  payload?: unknown;
}

export type Reducer<S, A extends Action> = (state: S, action: A) => S;

export interface ReducerStore<S, A extends Action> {
  getState: () => S;
  dispatch: (action: A) => void;
  subscribe: (listener: (state: S) => void) => () => void;
}

export interface Debouncer<T extends (...args: any[]) => void> {
  call: (...args: Parameters<T>) => void;
  cancel: () => void;
  flush: () => void;
  getCallCount: () => number;
  getPendingCount: () => number;
}

export interface LifecycleEvent {
  type: 'mount' | 'update' | 'unmount';
  timestamp: number;
  data?: Record<string, unknown>;
}

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

export function createStore<T extends Record<string, unknown>>(initialState: T): Store<T> {
  let state: T = { ...initialState };
  const subscribers = new Set<(state: T) => void>();

  return {
    getState(): T {
      return state;
    },

    setState(partial: Partial<T> | ((state: T) => Partial<T>)): void {
      const updates = typeof partial === 'function' ? partial(state) : partial;
      state = { ...state, ...updates };
      for (const listener of subscribers) {
        listener(state);
      }
    },

    subscribe(listener: (state: T) => void): () => void {
      subscribers.add(listener);
      return () => {
        subscribers.delete(listener);
      };
    },

    getSubscriberCount(): number {
      return subscribers.size;
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Exercice 2 : createReducerStore
// ═══════════════════════════════════════════════════════════════════════════════

export function createReducerStore<S, A extends Action>(
  reducer: Reducer<S, A>,
  initialState: S,
): ReducerStore<S, A> {
  let state: S = initialState;
  const subscribers = new Set<(state: S) => void>();

  return {
    getState(): S {
      return state;
    },

    dispatch(action: A): void {
      state = reducer(state, action);
      for (const listener of subscribers) {
        listener(state);
      }
    },

    subscribe(listener: (state: S) => void): () => void {
      subscribers.add(listener);
      return () => {
        subscribers.delete(listener);
      };
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Exercice 3 : createDebouncer
// ═══════════════════════════════════════════════════════════════════════════════

export function createDebouncer<T extends (...args: any[]) => void>(
  fn: T,
  delay: number,
): Debouncer<T> {
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let callCount = 0;
  let pendingArgs: Parameters<T> | null = null;

  const execute = () => {
    if (pendingArgs !== null) {
      fn(...pendingArgs);
      callCount++;
      pendingArgs = null;
      timerId = null;
    }
  };

  return {
    call(...args: Parameters<T>): void {
      if (timerId !== null) {
        clearTimeout(timerId);
      }
      pendingArgs = args;
      timerId = setTimeout(execute, delay);
    },

    cancel(): void {
      if (timerId !== null) {
        clearTimeout(timerId);
        timerId = null;
        pendingArgs = null;
      }
    },

    flush(): void {
      if (timerId !== null) {
        clearTimeout(timerId);
        timerId = null;
      }
      execute();
    },

    getCallCount(): number {
      return callCount;
    },

    getPendingCount(): number {
      return pendingArgs !== null ? 1 : 0;
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Exercice 4 : immutableUpdate
// ═══════════════════════════════════════════════════════════════════════════════

export function immutableUpdate(
  obj: Record<string, unknown>,
  path: (string | number)[],
  value: unknown,
): Record<string, unknown> {
  if (path.length === 0) {
    return value as Record<string, unknown>;
  }

  const [head, ...rest] = path;
  const current = (obj as any)[head];

  const updated = rest.length === 0
    ? value
    : immutableUpdate(current, rest, value);

  if (Array.isArray(obj)) {
    const copy = [...obj];
    copy[head as number] = updated;
    return copy as unknown as Record<string, unknown>;
  }

  return { ...obj, [head]: updated };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Exercice 5 : createLifecycleTracker
// ═══════════════════════════════════════════════════════════════════════════════

export function createLifecycleTracker(): LifecycleTracker {
  let events: LifecycleEvent[] = [];
  let mounted = false;
  let mountCount = 0;

  return {
    mount(data?: Record<string, unknown>): void {
      if (mounted) {
        throw new Error('Already mounted — call unmount() first');
      }
      mounted = true;
      mountCount++;
      events.push({ type: 'mount', timestamp: Date.now(), data });
    },

    update(data?: Record<string, unknown>): void {
      if (!mounted) {
        throw new Error('Not mounted — call mount() first');
      }
      events.push({ type: 'update', timestamp: Date.now(), data });
    },

    unmount(data?: Record<string, unknown>): void {
      if (!mounted) {
        throw new Error('Not mounted — call mount() first');
      }
      mounted = false;
      events.push({ type: 'unmount', timestamp: Date.now(), data });
    },

    getEvents(): LifecycleEvent[] {
      return [...events];
    },

    getEventsByType(type: LifecycleEvent['type']): LifecycleEvent[] {
      return events.filter(e => e.type === type);
    },

    isMounted(): boolean {
      return mounted;
    },

    getMountCount(): number {
      return mountCount;
    },

    reset(): void {
      events = [];
      mounted = false;
      mountCount = 0;
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════════

const runner = createTestRunner('Lab 03 — State et cycle de vie (Solution)');

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
  assertEqual(result, '');
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
  assertEqual((original as any).age, 30);
});

runner.test('immutableUpdate: met a jour une propriete imbriquee', () => {
  const original = { user: { address: { city: 'Paris' } } };
  const updated = immutableUpdate(original, ['user', 'address', 'city'], 'Lyon');
  assertEqual((updated as any).user.address.city, 'Lyon');
  assertEqual((original as any).user.address.city, 'Paris');
});

runner.test('immutableUpdate: met a jour un element de tableau', () => {
  const original = { items: ['a', 'b', 'c'] };
  const updated = immutableUpdate(original, ['items', 1], 'B');
  assertDeepEqual((updated as any).items, ['a', 'B', 'c']);
  assertDeepEqual((original as any).items, ['a', 'b', 'c']);
});

runner.test('immutableUpdate: chemin profond avec tableau', () => {
  const original = { users: [{ name: 'Alice', scores: [10, 20] }] };
  const updated = immutableUpdate(original, ['users', 0, 'scores', 1], 25);
  assertEqual((updated as any).users[0].scores[1], 25);
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
  tracker.update({ reason: 'props changed' });
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
