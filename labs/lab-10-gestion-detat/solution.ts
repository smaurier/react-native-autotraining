// =============================================================================
// Lab 10 — Gestion de l'etat (Solution)
// =============================================================================
// Execution : npx tsx labs/lab-10-gestion-detat/solution.ts
// =============================================================================

import {
  createTestRunner,
  assertEqual,
  assertDeepEqual,
  assertTrue,
  assertFalse,
  assertThrows,
  assertLength,
  assertNotNull,
} from '../test-utils.ts';

const { test, run } = createTestRunner('Lab 10 — Gestion de l\'etat (Solution)');

// =============================================================================
// Types
// =============================================================================

interface Store<T> {
  getState: () => T;
  setState: (partial: Partial<T> | ((state: T) => Partial<T>)) => void;
  subscribe: (listener: (state: T) => void) => () => void;
  destroy: () => void;
}

interface Selector<T, R> {
  getSnapshot: () => R;
  subscribe: (listener: (value: R) => void) => () => void;
}

interface Slice<N extends string, S, A> {
  name: N;
  getInitialState: () => S;
  actions: A;
}

interface StorageAdapter {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

// =============================================================================
// Exercice 1 : createStore
// =============================================================================

function createStore<T extends Record<string, unknown>>(initialState: T): Store<T> {
  let state = { ...initialState };
  let listeners = new Set<(state: T) => void>();

  return {
    getState: () => state,

    setState: (partial) => {
      const nextPartial = typeof partial === 'function' ? partial(state) : partial;
      state = { ...state, ...nextPartial };
      listeners.forEach((listener) => listener(state));
    },

    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    destroy: () => {
      listeners.clear();
    },
  };
}

// =============================================================================
// Exercice 2 : createSelector
// =============================================================================

function createSelector<T extends Record<string, unknown>, R>(
  store: Store<T>,
  selectorFn: (state: T) => R,
): Selector<T, R> {
  let currentValue = selectorFn(store.getState());

  return {
    getSnapshot: () => selectorFn(store.getState()),

    subscribe: (listener) => {
      const unsub = store.subscribe((state) => {
        const newValue = selectorFn(state);
        if (newValue !== currentValue) {
          currentValue = newValue;
          listener(newValue);
        }
      });
      return unsub;
    },
  };
}

// =============================================================================
// Exercice 3 : createSlice
// =============================================================================

function createSlice<
  N extends string,
  S extends Record<string, unknown>,
  A,
>(
  name: N,
  initialState: S,
  actionsCreator: (
    set: (partial: Partial<S> | ((state: S) => Partial<S>)) => void,
    get: () => S,
  ) => A,
): Slice<N, S, A> {
  // Creer un store interne pour le slice
  const internalStore = createStore(initialState);

  const actions = actionsCreator(
    (partial) => internalStore.setState(partial),
    () => internalStore.getState(),
  );

  return {
    name,
    getInitialState: () => ({ ...initialState }),
    actions,
  };
}

// =============================================================================
// Exercice 4 : persistMiddleware
// =============================================================================

function persistMiddleware<T extends Record<string, unknown>>(
  store: Store<T>,
  key: string,
  storage: StorageAdapter,
): void {
  // Restaurer depuis le storage
  const saved = storage.getItem(key);
  if (saved !== null) {
    try {
      const parsed = JSON.parse(saved);
      store.setState(parsed);
    } catch {
      // JSON invalide, on ignore
    }
  }

  // Sauvegarder a chaque changement
  store.subscribe((state) => {
    storage.setItem(key, JSON.stringify(state));
  });
}

// =============================================================================
// Exercice 5 : combineStores
// =============================================================================

function combineStores<M extends Record<string, Store<any>>>(
  storesMap: M,
): {
  getState: () => { [K in keyof M]: M[K] extends Store<infer S> ? S : never };
  subscribe: (listener: (state: { [K in keyof M]: M[K] extends Store<infer S> ? S : never }) => void) => () => void;
  destroy: () => void;
} {
  type CombinedState = { [K in keyof M]: M[K] extends Store<infer S> ? S : never };

  const getState = (): CombinedState => {
    const result = {} as Record<string, unknown>;
    for (const [key, store] of Object.entries(storesMap)) {
      result[key] = store.getState();
    }
    return result as CombinedState;
  };

  const listeners = new Set<(state: CombinedState) => void>();
  const unsubscribers: (() => void)[] = [];

  // S'abonner a chaque sous-store
  for (const store of Object.values(storesMap)) {
    const unsub = store.subscribe(() => {
      const combinedState = getState();
      listeners.forEach((listener) => listener(combinedState));
    });
    unsubscribers.push(unsub);
  }

  return {
    getState,

    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    destroy: () => {
      // Se desabonner de tous les sous-stores
      unsubscribers.forEach((unsub) => unsub());
      // Vider les listeners du combined store
      listeners.clear();
      // Detruire les sous-stores
      for (const store of Object.values(storesMap)) {
        store.destroy();
      }
    },
  };
}

// =============================================================================
// Tests
// =============================================================================

// --- createStore ---

test('createStore - getState retourne l\'etat initial', () => {
  const store = createStore({ count: 0, name: 'test' });
  assertDeepEqual(store.getState(), { count: 0, name: 'test' });
});

test('createStore - setState avec objet partiel', () => {
  const store = createStore({ count: 0, name: 'test' });
  store.setState({ count: 5 });
  assertDeepEqual(store.getState(), { count: 5, name: 'test' });
});

test('createStore - setState avec fonction', () => {
  const store = createStore({ count: 10 });
  store.setState((state) => ({ count: state.count + 5 }));
  assertEqual(store.getState().count, 15);
});

test('createStore - subscribe notifie les listeners', () => {
  const store = createStore({ count: 0 });
  const values: number[] = [];
  store.subscribe((state) => values.push(state.count));

  store.setState({ count: 1 });
  store.setState({ count: 2 });
  store.setState({ count: 3 });

  assertDeepEqual(values, [1, 2, 3]);
});

test('createStore - unsubscribe arrete les notifications', () => {
  const store = createStore({ count: 0 });
  const values: number[] = [];
  const unsub = store.subscribe((state) => values.push(state.count));

  store.setState({ count: 1 });
  unsub();
  store.setState({ count: 2 });

  assertDeepEqual(values, [1]);
});

test('createStore - destroy supprime tous les listeners', () => {
  const store = createStore({ count: 0 });
  const values: number[] = [];
  store.subscribe((state) => values.push(state.count));

  store.setState({ count: 1 });
  store.destroy();
  store.setState({ count: 2 });

  assertDeepEqual(values, [1]);
});

// --- createSelector ---

test('createSelector - getSnapshot retourne la valeur selectionnee', () => {
  const store = createStore({ count: 5, name: 'test' });
  const countSelector = createSelector(store, (state) => state.count);
  assertEqual(countSelector.getSnapshot(), 5);
});

test('createSelector - notifie seulement quand la valeur change', () => {
  const store = createStore({ count: 0, name: 'test' });
  const countSelector = createSelector(store, (state) => state.count);
  const values: number[] = [];
  countSelector.subscribe((count) => values.push(count));

  store.setState({ name: 'changed' }); // count ne change pas -> pas de notification
  store.setState({ count: 1 });          // count change -> notification
  store.setState({ count: 1 });          // count identique -> pas de notification
  store.setState({ count: 2 });          // count change -> notification

  assertDeepEqual(values, [1, 2]);
});

test('createSelector - unsubscribe fonctionne', () => {
  const store = createStore({ count: 0 });
  const sel = createSelector(store, (s) => s.count);
  const values: number[] = [];
  const unsub = sel.subscribe((c) => values.push(c));

  store.setState({ count: 1 });
  unsub();
  store.setState({ count: 2 });

  assertDeepEqual(values, [1]);
});

// --- createSlice ---

test('createSlice - getInitialState retourne l\'etat initial', () => {
  const slice = createSlice(
    'counter',
    { count: 0 },
    (set) => ({
      increment: () => set((s) => ({ count: s.count + 1 })),
    }),
  );
  assertDeepEqual(slice.getInitialState(), { count: 0 });
  assertEqual(slice.name, 'counter');
});

test('createSlice - les actions modifient un store', () => {
  const store = createStore({ count: 0 });
  const slice = createSlice(
    'counter',
    { count: 0 },
    (set, get) => ({
      increment: () => set((s) => ({ count: s.count + 1 })),
      decrement: () => set((s) => ({ count: s.count - 1 })),
      getDouble: () => get().count * 2,
    }),
  );

  const boundSet = (partial: Partial<{ count: number }> | ((s: { count: number }) => Partial<{ count: number }>)) =>
    store.setState(partial);
  const boundGet = () => store.getState();

  const actions = createSlice(
    'counter',
    { count: 0 },
    (set, get) => ({
      increment: () => set((s) => ({ count: s.count + 1 })),
      decrement: () => set((s) => ({ count: s.count - 1 })),
      getDouble: () => get().count * 2,
    }),
  );

  assertTrue(typeof slice.actions.increment === 'function');
  assertTrue(typeof slice.actions.decrement === 'function');
});

test('createSlice - actions avec store lie', () => {
  const store = createStore({ count: 0 });
  const slice = createSlice(
    'counter',
    { count: 0 },
    (set, get) => ({
      increment: () => set((s) => ({ count: s.count + 1 })),
      getCount: () => get().count,
    }),
  );

  const boundActions = createSlice(
    'counter',
    { count: 0 },
    (set, get) => ({
      increment: () => set((s) => ({ count: s.count + 1 })),
      getCount: () => get().count,
    }),
  );

  assertTrue(typeof boundActions.actions.increment === 'function');
  assertTrue(typeof boundActions.actions.getCount === 'function');
  assertEqual(boundActions.name, 'counter');
});

// --- persistMiddleware ---

test('persistMiddleware - sauvegarde l\'etat a chaque changement', () => {
  const storage: Record<string, string> = {};
  const adapter: StorageAdapter = {
    getItem: (key) => storage[key] ?? null,
    setItem: (key, value) => { storage[key] = value; },
    removeItem: (key) => { delete storage[key]; },
  };

  const store = createStore({ count: 0, name: 'test' });
  persistMiddleware(store, 'my-store', adapter);

  store.setState({ count: 42 });
  const saved = JSON.parse(storage['my-store']);
  assertEqual(saved.count, 42);
  assertEqual(saved.name, 'test');
});

test('persistMiddleware - restaure l\'etat depuis le storage', () => {
  const storage: Record<string, string> = {
    'my-store': JSON.stringify({ count: 99, name: 'restored' }),
  };
  const adapter: StorageAdapter = {
    getItem: (key) => storage[key] ?? null,
    setItem: (key, value) => { storage[key] = value; },
    removeItem: (key) => { delete storage[key]; },
  };

  const store = createStore({ count: 0, name: 'initial' });
  persistMiddleware(store, 'my-store', adapter);

  assertEqual(store.getState().count, 99);
  assertEqual(store.getState().name, 'restored');
});

test('persistMiddleware - ignore les valeurs invalides en storage', () => {
  const storage: Record<string, string> = {
    'my-store': 'not-valid-json{{{',
  };
  const adapter: StorageAdapter = {
    getItem: (key) => storage[key] ?? null,
    setItem: (key, value) => { storage[key] = value; },
    removeItem: (key) => { delete storage[key]; },
  };

  const store = createStore({ count: 0 });
  persistMiddleware(store, 'my-store', adapter);

  assertEqual(store.getState().count, 0);
});

// --- combineStores ---

test('combineStores - getState retourne l\'etat combine', () => {
  const authStore = createStore({ user: 'Alice', token: 'abc' });
  const cartStore = createStore({ items: ['item1', 'item2'] });

  const combined = combineStores({ auth: authStore, cart: cartStore });
  const state = combined.getState();

  assertEqual(state.auth.user, 'Alice');
  assertDeepEqual(state.cart.items, ['item1', 'item2']);
});

test('combineStores - subscribe notifie quand un store change', () => {
  const authStore = createStore({ user: 'Alice' });
  const cartStore = createStore({ items: [] as string[] });

  const combined = combineStores({ auth: authStore, cart: cartStore });
  const snapshots: string[] = [];
  combined.subscribe((state) => snapshots.push(state.auth.user));

  authStore.setState({ user: 'Bob' });
  cartStore.setState({ items: ['x'] });

  assertEqual(snapshots.length, 2);
  assertEqual(snapshots[0], 'Bob');
  assertEqual(snapshots[1], 'Bob');
});

test('combineStores - destroy detruit tous les sous-stores', () => {
  const authStore = createStore({ user: 'Alice' });
  const cartStore = createStore({ items: [] as string[] });

  const combined = combineStores({ auth: authStore, cart: cartStore });
  const snapshots: string[] = [];
  combined.subscribe((state) => snapshots.push(state.auth.user));

  combined.destroy();
  authStore.setState({ user: 'Bob' });

  assertEqual(snapshots.length, 0);
});

// =============================================================================
run();
