// =============================================================================
// Lab 20 — Testing React Native (Solution)
// =============================================================================
// Execution : npx tsx labs/lab-20-testing/solution.ts
// =============================================================================

import {
  createTestRunner,
  assertEqual,
  assertDeepEqual,
  assertTrue,
  assertFalse,
  assertThrows,
  assertLength,
  assertContains,
} from '../test-utils.ts';

const { test, run } = createTestRunner('Lab 20 — Testing React Native (Solution)');

// =============================================================================
// Types
// =============================================================================

interface VirtualNode {
  type: string;
  props: Record<string, unknown>;
  children: VirtualNode[];
}

interface TestRendererResult {
  root: VirtualNode;
  rerender: (newProps: Record<string, unknown>) => void;
  unmount: () => void;
  isMounted: () => boolean;
  getByProps: (props: Record<string, unknown>) => VirtualNode | null;
  getByType: (type: string) => VirtualNode[];
  getRenderCount: () => number;
}

interface MockStoreOptions<T> {
  initialState: T;
  reducers?: Record<string, (state: T, payload: any) => Partial<T>>;
}

interface MockStore<T> {
  getState: () => T;
  dispatch: (action: { type: string; payload?: any }) => void;
  getActions: () => Array<{ type: string; payload?: any }>;
  reset: () => void;
  subscribe: (listener: (state: T) => void) => () => void;
}

interface MockApiHandler {
  method: 'GET' | 'POST' | 'DELETE';
  path: string;
  response: { status: number; data: unknown };
}

interface MockApi {
  get: (path: string) => Promise<{ status: number; data: unknown }>;
  post: (path: string, body?: unknown) => Promise<{ status: number; data: unknown }>;
  delete: (path: string) => Promise<{ status: number; data: unknown }>;
  getRequestLog: () => Array<{ method: string; path: string; body?: unknown }>;
  reset: () => void;
}

interface Snapshot {
  name: string;
  content: string;
  timestamp: number;
}

interface SnapshotManager {
  take: (name: string, content: string) => void;
  compare: (name: string, content: string) => { match: boolean; diff?: string };
  update: (name: string, content: string) => void;
  getAll: () => Snapshot[];
  delete: (name: string) => boolean;
}

interface FileCoverage {
  file: string;
  totalLines: number;
  coveredLines: number[];
}

interface CoverageTracker {
  markCovered: (file: string, line: number) => void;
  getReport: (file: string) => { total: number; covered: number; percentage: number };
  getUncoveredLines: (file: string) => number[];
  getGlobalReport: () => { totalFiles: number; totalLines: number; coveredLines: number; percentage: number };
}

// =============================================================================
// Exercice 1 : createTestRenderer
// =============================================================================

function createTestRenderer(
  type: string,
  props: Record<string, unknown>,
  children: VirtualNode[] = []
): TestRendererResult {
  let mounted = true;
  let renderCount = 1;
  const root: VirtualNode = { type, props: { ...props }, children: [...children] };

  function findByProps(
    node: VirtualNode,
    searchProps: Record<string, unknown>
  ): VirtualNode | null {
    const matches = Object.entries(searchProps).every(
      ([key, value]) => JSON.stringify(node.props[key]) === JSON.stringify(value)
    );
    if (matches) return node;
    for (const child of node.children) {
      const found = findByProps(child, searchProps);
      if (found) return found;
    }
    return null;
  }

  function findByType(node: VirtualNode, searchType: string): VirtualNode[] {
    const results: VirtualNode[] = [];
    if (node.type === searchType) results.push(node);
    for (const child of node.children) {
      results.push(...findByType(child, searchType));
    }
    return results;
  }

  return {
    root,

    rerender(newProps: Record<string, unknown>) {
      if (!mounted) throw new Error('Cannot rerender an unmounted component');
      Object.assign(root.props, newProps);
      renderCount++;
    },

    unmount() {
      mounted = false;
    },

    isMounted() {
      return mounted;
    },

    getByProps(searchProps: Record<string, unknown>) {
      return findByProps(root, searchProps);
    },

    getByType(searchType: string) {
      return findByType(root, searchType);
    },

    getRenderCount() {
      return renderCount;
    },
  };
}

// =============================================================================
// Exercice 2 : createMockStore
// =============================================================================

function createMockStore<T extends Record<string, unknown>>(
  options: MockStoreOptions<T>
): MockStore<T> {
  let state: T = { ...options.initialState };
  let actions: Array<{ type: string; payload?: any }> = [];
  const listeners = new Set<(state: T) => void>();

  return {
    getState() {
      return state;
    },

    dispatch(action: { type: string; payload?: any }) {
      actions.push(action);

      if (options.reducers && options.reducers[action.type]) {
        const partial = options.reducers[action.type](state, action.payload);
        state = { ...state, ...partial };
      }

      for (const listener of listeners) {
        listener(state);
      }
    },

    getActions() {
      return [...actions];
    },

    reset() {
      state = { ...options.initialState };
      actions = [];
    },

    subscribe(listener: (state: T) => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

// =============================================================================
// Exercice 3 : createMockApi
// =============================================================================

function createMockApi(handlers: MockApiHandler[]): MockApi {
  let requestLog: Array<{ method: string; path: string; body?: unknown }> = [];

  function findHandler(method: string, path: string): { status: number; data: unknown } {
    const handler = handlers.find((h) => h.method === method && h.path === path);
    if (handler) return handler.response;
    return { status: 404, data: 'Not Found' };
  }

  return {
    async get(path: string) {
      requestLog.push({ method: 'GET', path });
      return findHandler('GET', path);
    },

    async post(path: string, body?: unknown) {
      requestLog.push({ method: 'POST', path, body });
      return findHandler('POST', path);
    },

    async delete(path: string) {
      requestLog.push({ method: 'DELETE', path });
      return findHandler('DELETE', path);
    },

    getRequestLog() {
      return [...requestLog];
    },

    reset() {
      requestLog = [];
    },
  };
}

// =============================================================================
// Exercice 4 : createSnapshotManager
// =============================================================================

function createSnapshotManager(): SnapshotManager {
  const snapshots = new Map<string, Snapshot>();

  return {
    take(name: string, content: string) {
      if (snapshots.has(name)) {
        throw new Error(`Snapshot "${name}" already exists. Use update() to modify it.`);
      }
      snapshots.set(name, { name, content, timestamp: Date.now() });
    },

    compare(name: string, content: string) {
      const existing = snapshots.get(name);
      if (!existing) {
        throw new Error(`Snapshot "${name}" does not exist.`);
      }
      if (existing.content === content) {
        return { match: true };
      }
      return {
        match: false,
        diff: `Expected: ${existing.content}, Received: ${content}`,
      };
    },

    update(name: string, content: string) {
      snapshots.set(name, { name, content, timestamp: Date.now() });
    },

    getAll() {
      return [...snapshots.values()];
    },

    delete(name: string) {
      return snapshots.delete(name);
    },
  };
}

// =============================================================================
// Exercice 5 : createCoverageTracker
// =============================================================================

function createCoverageTracker(
  files: Array<{ file: string; totalLines: number }>
): CoverageTracker {
  const fileMap = new Map<string, { totalLines: number; covered: Set<number> }>();

  for (const f of files) {
    fileMap.set(f.file, { totalLines: f.totalLines, covered: new Set() });
  }

  return {
    markCovered(file: string, line: number) {
      const entry = fileMap.get(file);
      if (!entry) {
        throw new Error(`File "${file}" is not tracked`);
      }
      if (line < 1 || line > entry.totalLines) {
        throw new Error(`Line ${line} is out of range for "${file}" (1-${entry.totalLines})`);
      }
      entry.covered.add(line);
    },

    getReport(file: string) {
      const entry = fileMap.get(file);
      if (!entry) {
        throw new Error(`File "${file}" is not tracked`);
      }
      const percentage = Math.round((entry.covered.size / entry.totalLines) * 10000) / 100;
      return {
        total: entry.totalLines,
        covered: entry.covered.size,
        percentage,
      };
    },

    getUncoveredLines(file: string) {
      const entry = fileMap.get(file);
      if (!entry) {
        throw new Error(`File "${file}" is not tracked`);
      }
      const uncovered: number[] = [];
      for (let i = 1; i <= entry.totalLines; i++) {
        if (!entry.covered.has(i)) {
          uncovered.push(i);
        }
      }
      return uncovered;
    },

    getGlobalReport() {
      let totalLines = 0;
      let coveredLines = 0;
      for (const entry of fileMap.values()) {
        totalLines += entry.totalLines;
        coveredLines += entry.covered.size;
      }
      const percentage = totalLines === 0 ? 0 : Math.round((coveredLines / totalLines) * 10000) / 100;
      return {
        totalFiles: fileMap.size,
        totalLines,
        coveredLines,
        percentage,
      };
    },
  };
}

// =============================================================================
// Tests
// =============================================================================

// --- Exercice 1 : createTestRenderer ---

test('Ex1: cree un arbre virtuel et compte les renders', () => {
  const result = createTestRenderer('View', { style: { flex: 1 } }, [
    { type: 'Text', props: { children: 'Hello' }, children: [] },
  ]);
  assertEqual(result.root.type, 'View');
  assertDeepEqual(result.root.props, { style: { flex: 1 } });
  assertLength(result.root.children, 1);
  assertEqual(result.root.children[0].type, 'Text');
  assertEqual(result.getRenderCount(), 1);
  assertTrue(result.isMounted());
});

test('Ex1: rerender met a jour les props et incremente le compteur', () => {
  const result = createTestRenderer('Text', { value: 'A' });
  assertEqual(result.root.props.value, 'A');
  result.rerender({ value: 'B' });
  assertEqual(result.root.props.value, 'B');
  assertEqual(result.getRenderCount(), 2);
});

test('Ex1: unmount empeche les operations suivantes', () => {
  const result = createTestRenderer('View', {});
  result.unmount();
  assertFalse(result.isMounted());
  let threw = false;
  try { result.rerender({ x: 1 }); } catch { threw = true; }
  assertTrue(threw, 'rerender apres unmount devrait lever une erreur');
});

test('Ex1: getByProps et getByType recherchent recursivement', () => {
  const result = createTestRenderer('View', { testID: 'root' }, [
    { type: 'Text', props: { testID: 'title', value: 'Hello' }, children: [] },
    {
      type: 'View', props: { testID: 'container' }, children: [
        { type: 'Button', props: { testID: 'btn', label: 'OK' }, children: [] },
        { type: 'Text', props: { testID: 'subtitle', value: 'World' }, children: [] },
      ],
    },
  ]);
  const btn = result.getByProps({ label: 'OK' });
  assertDeepEqual(btn!.type, 'Button');
  assertDeepEqual(btn!.props.testID, 'btn');

  const texts = result.getByType('Text');
  assertLength(texts, 2);
  assertEqual(texts[0].props.testID, 'title');
  assertEqual(texts[1].props.testID, 'subtitle');

  const notFound = result.getByProps({ label: 'NOPE' });
  assertEqual(notFound, null);
});

// --- Exercice 2 : createMockStore ---

test('Ex2: dispatch enregistre les actions et applique les reducers', () => {
  const store = createMockStore<{ count: number; name: string }>({
    initialState: { count: 0, name: 'test' },
    reducers: {
      increment: (state) => ({ count: state.count + 1 }),
      setName: (_state, payload: string) => ({ name: payload }),
    },
  });
  store.dispatch({ type: 'increment' });
  store.dispatch({ type: 'increment' });
  store.dispatch({ type: 'setName', payload: 'Alice' });
  assertEqual(store.getState().count, 2);
  assertEqual(store.getState().name, 'Alice');
  assertLength(store.getActions(), 3);
});

test('Ex2: subscribe notifie les listeners et unsubscribe fonctionne', () => {
  const store = createMockStore<{ value: number }>({
    initialState: { value: 0 },
    reducers: { set: (_s, p: number) => ({ value: p }) },
  });
  const values: number[] = [];
  const unsub = store.subscribe((state) => values.push(state.value));
  store.dispatch({ type: 'set', payload: 10 });
  store.dispatch({ type: 'set', payload: 20 });
  unsub();
  store.dispatch({ type: 'set', payload: 30 });
  assertDeepEqual(values, [10, 20]);
  assertEqual(store.getState().value, 30);
});

test('Ex2: reset remet l etat initial et vide les actions', () => {
  const store = createMockStore<{ count: number }>({
    initialState: { count: 0 },
    reducers: { inc: (s) => ({ count: s.count + 1 }) },
  });
  store.dispatch({ type: 'inc' });
  store.dispatch({ type: 'inc' });
  assertEqual(store.getState().count, 2);
  store.reset();
  assertEqual(store.getState().count, 0);
  assertLength(store.getActions(), 0);
});

test('Ex2: dispatch sans reducer enregistre quand meme l action', () => {
  const store = createMockStore<{ x: number }>({
    initialState: { x: 1 },
  });
  store.dispatch({ type: 'unknownAction', payload: 42 });
  assertEqual(store.getState().x, 1); // state inchange
  assertLength(store.getActions(), 1);
  assertEqual(store.getActions()[0].type, 'unknownAction');
});

// --- Exercice 3 : createMockApi ---

test('Ex3: get et post retournent les reponses configurees', async () => {
  const api = createMockApi([
    { method: 'GET', path: '/products', response: { status: 200, data: [{ id: '1' }] } },
    { method: 'POST', path: '/cart', response: { status: 201, data: { success: true } } },
  ]);
  const products = await api.get('/products');
  assertEqual(products.status, 200);
  assertDeepEqual(products.data, [{ id: '1' }]);

  const cart = await api.post('/cart', { productId: '1' });
  assertEqual(cart.status, 201);
  assertDeepEqual(cart.data, { success: true });
});

test('Ex3: retourne 404 pour les routes non configurees', async () => {
  const api = createMockApi([
    { method: 'GET', path: '/products', response: { status: 200, data: [] } },
  ]);
  const result = await api.get('/unknown');
  assertEqual(result.status, 404);

  const deleteResult = await api.delete('/products/1');
  assertEqual(deleteResult.status, 404);
});

test('Ex3: getRequestLog enregistre toutes les requetes', async () => {
  const api = createMockApi([
    { method: 'GET', path: '/products', response: { status: 200, data: [] } },
    { method: 'POST', path: '/cart', response: { status: 201, data: {} } },
    { method: 'DELETE', path: '/cart/1', response: { status: 204, data: null } },
  ]);
  await api.get('/products');
  await api.post('/cart', { productId: '1' });
  await api.delete('/cart/1');
  await api.get('/notfound');

  const log = api.getRequestLog();
  assertLength(log, 4);
  assertEqual(log[0].method, 'GET');
  assertEqual(log[0].path, '/products');
  assertEqual(log[1].method, 'POST');
  assertDeepEqual(log[1].body, { productId: '1' });
  assertEqual(log[2].method, 'DELETE');
  assertEqual(log[3].path, '/notfound');
});

test('Ex3: reset vide le log mais garde les handlers', async () => {
  const api = createMockApi([
    { method: 'GET', path: '/products', response: { status: 200, data: ['a'] } },
  ]);
  await api.get('/products');
  assertLength(api.getRequestLog(), 1);
  api.reset();
  assertLength(api.getRequestLog(), 0);
  // Les handlers sont toujours la
  const result = await api.get('/products');
  assertEqual(result.status, 200);
});

// --- Exercice 4 : createSnapshotManager ---

test('Ex4: take et compare fonctionnent', () => {
  const mgr = createSnapshotManager();
  mgr.take('header', '<View><Text>Hello</Text></View>');
  const match = mgr.compare('header', '<View><Text>Hello</Text></View>');
  assertTrue(match.match);
  assertEqual(match.diff, undefined);

  const noMatch = mgr.compare('header', '<View><Text>Bye</Text></View>');
  assertFalse(noMatch.match);
  assertContains(noMatch.diff!, 'Expected');
  assertContains(noMatch.diff!, 'Received');
});

test('Ex4: take leve une erreur si le snapshot existe deja', () => {
  const mgr = createSnapshotManager();
  mgr.take('card', '<Card />');
  let threw = false;
  try { mgr.take('card', '<Card v2 />'); } catch { threw = true; }
  assertTrue(threw, 'take sur un snapshot existant devrait lever une erreur');
});

test('Ex4: update cree ou met a jour un snapshot', () => {
  const mgr = createSnapshotManager();
  mgr.update('footer', '<Footer v1 />');
  const match1 = mgr.compare('footer', '<Footer v1 />');
  assertTrue(match1.match);

  mgr.update('footer', '<Footer v2 />');
  const match2 = mgr.compare('footer', '<Footer v2 />');
  assertTrue(match2.match);

  const noMatch = mgr.compare('footer', '<Footer v1 />');
  assertFalse(noMatch.match);
});

test('Ex4: delete et getAll fonctionnent', () => {
  const mgr = createSnapshotManager();
  mgr.take('a', 'content-a');
  mgr.take('b', 'content-b');
  assertLength(mgr.getAll(), 2);

  assertTrue(mgr.delete('a'));
  assertLength(mgr.getAll(), 1);
  assertFalse(mgr.delete('nonexistent'));
});

// --- Exercice 5 : createCoverageTracker ---

test('Ex5: markCovered et getReport', () => {
  const tracker = createCoverageTracker([
    { file: 'App.tsx', totalLines: 10 },
    { file: 'utils.ts', totalLines: 5 },
  ]);
  tracker.markCovered('App.tsx', 1);
  tracker.markCovered('App.tsx', 2);
  tracker.markCovered('App.tsx', 3);
  tracker.markCovered('App.tsx', 3); // doublon ignore

  const report = tracker.getReport('App.tsx');
  assertEqual(report.total, 10);
  assertEqual(report.covered, 3);
  assertEqual(report.percentage, 30);
});

test('Ex5: getUncoveredLines retourne les lignes non couvertes', () => {
  const tracker = createCoverageTracker([
    { file: 'small.ts', totalLines: 5 },
  ]);
  tracker.markCovered('small.ts', 1);
  tracker.markCovered('small.ts', 3);
  tracker.markCovered('small.ts', 5);
  assertDeepEqual(tracker.getUncoveredLines('small.ts'), [2, 4]);
});

test('Ex5: erreurs pour fichier inconnu ou ligne invalide', () => {
  const tracker = createCoverageTracker([
    { file: 'App.tsx', totalLines: 10 },
  ]);
  let threw = false;
  try { tracker.markCovered('unknown.ts', 1); } catch { threw = true; }
  assertTrue(threw, 'Fichier inconnu devrait lever une erreur');

  let threw2 = false;
  try { tracker.markCovered('App.tsx', 0); } catch { threw2 = true; }
  assertTrue(threw2, 'Ligne 0 devrait lever une erreur');

  let threw3 = false;
  try { tracker.markCovered('App.tsx', 11); } catch { threw3 = true; }
  assertTrue(threw3, 'Ligne > totalLines devrait lever une erreur');
});

test('Ex5: getGlobalReport agrege tous les fichiers', () => {
  const tracker = createCoverageTracker([
    { file: 'App.tsx', totalLines: 10 },
    { file: 'utils.ts', totalLines: 10 },
  ]);
  tracker.markCovered('App.tsx', 1);
  tracker.markCovered('App.tsx', 2);
  tracker.markCovered('utils.ts', 1);
  tracker.markCovered('utils.ts', 2);
  tracker.markCovered('utils.ts', 3);

  const global = tracker.getGlobalReport();
  assertEqual(global.totalFiles, 2);
  assertEqual(global.totalLines, 20);
  assertEqual(global.coveredLines, 5);
  assertEqual(global.percentage, 25);
});

// =============================================================================
// Lancement
// =============================================================================

run();
