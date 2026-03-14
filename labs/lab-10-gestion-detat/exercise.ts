// =============================================================================
// Lab 10 — Gestion de l'etat (Exercice)
// =============================================================================
// Execution : npx tsx labs/lab-10-gestion-detat/exercise.ts
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

const { test, run } = createTestRunner('Lab 10 — Gestion de l\'etat');

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
// Cree un store minimaliste inspire de Zustand.
//
// createStore(initialState) -> Store<T>
//
// - getState() retourne l'etat courant
// - setState(partial) fusionne un objet partiel dans l'etat
// - setState(fn) appelle fn(currentState) et fusionne le resultat
// - subscribe(listener) enregistre un listener appele a chaque setState
//   et retourne une fonction unsubscribe
// - destroy() supprime tous les listeners
// =============================================================================

// TODO: Implementez createStore

// =============================================================================
// Exercice 2 : createSelector
// Cree un selecteur qui ne notifie les listeners que quand la valeur
// selectionnee change (comparaison par reference ===).
//
// createSelector(store, selectorFn) -> Selector<T, R>
//
// - getSnapshot() retourne la valeur courante du selecteur
// - subscribe(listener) notifie seulement quand selectorFn retourne
//   une valeur differente de la precedente
// =============================================================================

// TODO: Implementez createSelector

// =============================================================================
// Exercice 3 : createSlice
// Cree un "slice" (tranche d'etat) avec des actions typees.
//
// createSlice(name, initialState, actionsCreator) -> Slice
//
// - actionsCreator recoit (set, get) et retourne un objet d'actions
// - Chaque action appelle set() pour modifier l'etat
// - getInitialState() retourne l'etat initial
// =============================================================================

// TODO: Implementez createSlice

// =============================================================================
// Exercice 4 : persistMiddleware
// Ajoute la persistence a un store existant.
//
// persistMiddleware(store, key, storage) -> void
//
// - A l'initialisation, lit la valeur depuis storage et appelle setState
// - A chaque changement d'etat (subscribe), serialise et sauvegarde
// - Si la valeur en storage est invalide (JSON.parse echoue), ignore
// =============================================================================

// TODO: Implementez persistMiddleware

// =============================================================================
// Exercice 5 : combineStores
// Combine plusieurs stores en un seul objet d'etat en lecture seule.
//
// combineStores(storesMap) -> { getState, subscribe, destroy }
//
// - getState() retourne un objet { [key]: storeState }
// - subscribe(listener) notifie quand n'importe quel store change
// - destroy() detruit tous les stores
// =============================================================================

// TODO: Implementez combineStores

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

  // Bind les actions au store
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

  // On teste que les actions du slice sont bien des fonctions
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

  // Creer les actions liees au store
  const boundActions = createSlice(
    'counter',
    { count: 0 },
    (set, get) => ({
      increment: () => set((s) => ({ count: s.count + 1 })),
      getCount: () => get().count,
    }),
  );

  // Le slice retourne bien des fonctions
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

  // L'etat initial est preserve
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
  cartStore.setState({ items: ['x'] }); // notifie aussi

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
  authStore.setState({ user: 'Bob' }); // plus de notification

  assertEqual(snapshots.length, 0);
});

// =============================================================================
run();
