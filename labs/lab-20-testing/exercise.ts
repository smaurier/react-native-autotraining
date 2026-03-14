// =============================================================================
// Lab 20 — Testing React Native (Exercice)
// =============================================================================
// Execution : npx tsx labs/lab-20-testing/exercise.ts
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

const { test, run } = createTestRunner('Lab 20 — Testing React Native');

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
// Simule un renderer de composants React (arbre virtuel).
//
// createTestRenderer(type, props, children?) -> TestRendererResult
//
// - root : le noeud racine { type, props, children }
// - rerender(newProps) : met a jour les props du root (incremente le compteur)
// - unmount() : marque comme demonte (les operations suivantes levent une erreur)
// - isMounted() : true si non demonte
// - getByProps(props) : trouve le premier noeud dont les props contiennent
//   toutes les paires cle/valeur donnees (recherche recursive)
// - getByType(type) : trouve tous les noeuds du type donne (recherche recursive)
// - getRenderCount() : nombre de renders (1 initial + chaque rerender)
// =============================================================================

// TODO: Implementez createTestRenderer

// =============================================================================
// Exercice 2 : createMockStore
// Simule un store de type Redux/Zustand avec tracking des actions.
//
// createMockStore(options: MockStoreOptions<T>) -> MockStore<T>
//
// - getState() : retourne l'etat courant
// - dispatch(action) : enregistre l'action, applique le reducer si defini
//   pour action.type, sinon juste enregistre l'action
// - getActions() : retourne toutes les actions dispatchees
// - reset() : remet l'etat initial et vide les actions
// - subscribe(listener) : appelle le listener a chaque dispatch,
//   retourne une fonction de desinscription
// =============================================================================

// TODO: Implementez createMockStore

// =============================================================================
// Exercice 3 : createMockApi
// Simule une API HTTP avec des handlers predetermines.
//
// createMockApi(handlers: MockApiHandler[]) -> MockApi
//
// - get(path) : cherche un handler GET pour ce path, retourne sa response.
//   Si aucun handler, retourne { status: 404, data: 'Not Found' }.
//   Enregistre la requete dans le log.
// - post(path, body?) : idem pour POST
// - delete(path) : idem pour DELETE
// - getRequestLog() : historique des requetes
// - reset() : vide le log (garde les handlers)
// =============================================================================

// TODO: Implementez createMockApi

// =============================================================================
// Exercice 4 : createSnapshotManager
// Gere des snapshots (comme Jest) pour comparer des rendus.
//
// createSnapshotManager() -> SnapshotManager
//
// - take(name, content) : enregistre un snapshot. Si un snapshot
//   existe deja pour ce nom, leve une erreur.
// - compare(name, content) : compare le content avec le snapshot existant.
//   Retourne { match: true } si identique, { match: false, diff: "..." }
//   si different (diff = "Expected: <ancien>, Received: <nouveau>").
//   Leve une erreur si le snapshot n'existe pas.
// - update(name, content) : met a jour un snapshot existant ou en cree un nouveau.
// - getAll() : retourne tous les snapshots
// - delete(name) : supprime un snapshot, retourne true si supprime, false si inexistant
// =============================================================================

// TODO: Implementez createSnapshotManager

// =============================================================================
// Exercice 5 : createCoverageTracker
// Suit la couverture de code par fichier.
//
// createCoverageTracker(files: Array<{ file: string; totalLines: number }>) -> CoverageTracker
//
// - markCovered(file, line) : marque une ligne comme couverte.
//   Si le fichier n'existe pas, lever une erreur.
//   Si la ligne > totalLines ou < 1, lever une erreur.
//   Les doublons sont ignores (une ligne deja couverte reste couverte).
// - getReport(file) : { total, covered, percentage }
//   percentage = (covered / total) * 100, arrondi a 2 decimales
// - getUncoveredLines(file) : lignes non couvertes (triees croissant)
// - getGlobalReport() : rapport agregant tous les fichiers
// =============================================================================

// TODO: Implementez createCoverageTracker

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
