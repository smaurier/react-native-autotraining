// =============================================================================
// Lab 19 — Performance et optimisation (Exercice)
// =============================================================================
// Execution : npx tsx labs/lab-19-performance/exercise.ts
// =============================================================================

import {
  createTestRunner,
  assertEqual,
  assertDeepEqual,
  assertTrue,
  assertFalse,
  assertGreaterThan,
  assertLength,
} from '../test-utils.ts';

const { test, run } = createTestRunner('Lab 19 — Performance et optimisation');

// =============================================================================
// Types
// =============================================================================

interface RenderEntry {
  component: string;
  timestamp: number;
  props: Record<string, unknown>;
}

interface RenderTracker {
  recordRender: (component: string, props: Record<string, unknown>) => void;
  getRenderCount: (component: string) => number;
  getUnnecessaryRenders: (component: string) => number;
  getRenderLog: (component: string) => RenderEntry[];
  reset: () => void;
}

interface MemoizedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): ReturnType<T>;
  cacheHits: number;
  cacheMisses: number;
  cacheSize: number;
  clearCache: () => void;
}

interface ModuleInfo {
  name: string;
  size: number;
  dependencies: string[];
}

interface BundleAnalyzer {
  getSize: (moduleName: string) => number;
  getDependencies: (moduleName: string) => string[];
  getTotalSize: () => number;
  findHeaviest: (n: number) => string[];
  suggestSplits: (maxChunkSize: number) => string[][];
}

interface MemoryAllocation {
  id: string;
  size: number;
  timestamp: number;
  released: boolean;
}

interface MemoryTracker {
  allocate: (id: string, size: number) => void;
  release: (id: string) => void;
  getUsage: () => { allocated: number; released: number; current: number };
  detectLeaks: (maxAgeMs: number) => string[];
  getAllocations: () => MemoryAllocation[];
}

interface BatchResult {
  updates: Array<{ key: string; value: unknown }>;
  batchCount: number;
  totalUpdates: number;
}

// =============================================================================
// Exercice 1 : createRenderTracker
// Suit les rendus des composants et detecte les re-renders inutiles.
//
// createRenderTracker() -> RenderTracker
//
// - recordRender(component, props) : enregistre un render avec timestamp
// - getRenderCount(component) : nombre total de renders
// - getUnnecessaryRenders(component) : nombre de renders ou les props
//   sont identiques (deep equal) au render precedent
// - getRenderLog(component) : historique des renders
// - reset() : vide tout
//
// Un render est "inutile" si les props sont deep-equal au precedent.
// On compare via JSON.stringify.
// =============================================================================

// TODO: Implementez createRenderTracker

// =============================================================================
// Exercice 2 : memoize
// Cree une version memoizee d'une fonction avec tracking des cache hits/misses.
//
// memoize(fn) -> MemoizedFunction
//
// - La cle de cache est JSON.stringify(args)
// - Proprietes : cacheHits, cacheMisses, cacheSize, clearCache()
// - cacheHits : nombre de fois ou le cache a ete utilise
// - cacheMisses : nombre de fois ou la fonction a ete appelee
// - cacheSize : nombre d'entrees dans le cache
// - clearCache() : vide le cache et remet les compteurs a 0
// =============================================================================

// TODO: Implementez memoize

// =============================================================================
// Exercice 3 : createBundleAnalyzer
// Analyse un graphe de modules pour optimiser la taille du bundle.
//
// createBundleAnalyzer(modules: ModuleInfo[]) -> BundleAnalyzer
//
// - getSize(name) : taille du module (0 si inconnu)
// - getDependencies(name) : dependances directes ([] si inconnu)
// - getTotalSize() : somme de toutes les tailles
// - findHeaviest(n) : les n modules les plus lourds (tries par taille desc)
// - suggestSplits(maxChunkSize) : groupes de modules dont la somme
//   des tailles <= maxChunkSize. Les modules sont ajoutes dans l'ordre
//   d'apparition. Quand un module ne rentre pas dans le chunk courant,
//   on cree un nouveau chunk.
// =============================================================================

// TODO: Implementez createBundleAnalyzer

// =============================================================================
// Exercice 4 : createMemoryTracker
// Suit les allocations et liberations memoire pour detecter les fuites.
//
// createMemoryTracker() -> MemoryTracker
//
// - allocate(id, size) : enregistre une allocation (avec timestamp Date.now())
// - release(id) : marque l'allocation comme liberee
// - getUsage() : { allocated (total), released (total), current (allocated - released) }
// - detectLeaks(maxAgeMs) : retourne les IDs des allocations non liberees
//   dont le timestamp est plus vieux que Date.now() - maxAgeMs
// - getAllocations() : toutes les allocations
//
// Si on alloue un id deja alloue (et non libere), lever une erreur.
// Si on libere un id inconnu ou deja libere, lever une erreur.
// =============================================================================

// TODO: Implementez createMemoryTracker

// =============================================================================
// Exercice 5 : batchUpdates
// Regroupe des mises a jour individuelles en lots pour optimiser les renders.
//
// batchUpdates(updates: Array<{ key: string; value: unknown }>, batchSize: number) -> BatchResult[]
//
// Decoupe le tableau de mises a jour en lots de taille batchSize.
// Chaque BatchResult contient :
// - updates : les mises a jour du lot
// - batchCount : numero du lot (1-based)
// - totalUpdates : nombre de mises a jour dans ce lot
//
// Le dernier lot peut contenir moins de batchSize elements.
// =============================================================================

// TODO: Implementez batchUpdates

// =============================================================================
// Tests
// =============================================================================

// --- Exercice 1 : createRenderTracker ---

test('Ex1: compte les renders d un composant', () => {
  const tracker = createRenderTracker();
  tracker.recordRender('ProductCard', { id: '1', name: 'iPhone' });
  tracker.recordRender('ProductCard', { id: '2', name: 'Galaxy' });
  tracker.recordRender('ProductCard', { id: '1', name: 'iPhone' });
  assertEqual(tracker.getRenderCount('ProductCard'), 3);
  assertEqual(tracker.getRenderCount('Header'), 0);
});

test('Ex1: detecte les re-renders inutiles (props identiques)', () => {
  const tracker = createRenderTracker();
  tracker.recordRender('Header', { title: 'Accueil' });
  tracker.recordRender('Header', { title: 'Accueil' }); // inutile
  tracker.recordRender('Header', { title: 'Profil' });
  tracker.recordRender('Header', { title: 'Profil' }); // inutile
  assertEqual(tracker.getUnnecessaryRenders('Header'), 2);
});

test('Ex1: getRenderLog retourne l historique', () => {
  const tracker = createRenderTracker();
  tracker.recordRender('Button', { label: 'OK' });
  tracker.recordRender('Button', { label: 'Cancel' });
  const log = tracker.getRenderLog('Button');
  assertLength(log, 2);
  assertEqual(log[0].component, 'Button');
  assertDeepEqual(log[0].props, { label: 'OK' });
  assertDeepEqual(log[1].props, { label: 'Cancel' });
  assertTrue(log[0].timestamp <= log[1].timestamp);
});

test('Ex1: reset vide tout', () => {
  const tracker = createRenderTracker();
  tracker.recordRender('Card', { id: '1' });
  tracker.recordRender('Card', { id: '1' });
  tracker.reset();
  assertEqual(tracker.getRenderCount('Card'), 0);
  assertEqual(tracker.getUnnecessaryRenders('Card'), 0);
  assertLength(tracker.getRenderLog('Card'), 0);
});

// --- Exercice 2 : memoize ---

test('Ex2: memoize retourne le resultat cache', () => {
  let callCount = 0;
  const expensive = memoize((n: number) => {
    callCount++;
    return n * n;
  });
  assertEqual(expensive(5), 25);
  assertEqual(expensive(5), 25);
  assertEqual(expensive(3), 9);
  assertEqual(callCount, 2); // seulement 2 appels reels
  assertEqual(expensive.cacheHits, 1);
  assertEqual(expensive.cacheMisses, 2);
});

test('Ex2: memoize avec plusieurs arguments', () => {
  const add = memoize((a: number, b: number) => a + b);
  assertEqual(add(1, 2), 3);
  assertEqual(add(1, 2), 3); // cache hit
  assertEqual(add(2, 1), 3); // cache miss (args differents)
  assertEqual(add.cacheHits, 1);
  assertEqual(add.cacheMisses, 2);
  assertEqual(add.cacheSize, 2);
});

test('Ex2: clearCache remet a zero', () => {
  const double = memoize((n: number) => n * 2);
  double(5);
  double(5);
  assertEqual(double.cacheHits, 1);
  double.clearCache();
  assertEqual(double.cacheHits, 0);
  assertEqual(double.cacheMisses, 0);
  assertEqual(double.cacheSize, 0);
  // Apres clear, doit recalculer
  assertEqual(double(5), 10);
  assertEqual(double.cacheMisses, 1);
});

// --- Exercice 3 : createBundleAnalyzer ---

test('Ex3: getSize et getDependencies', () => {
  const analyzer = createBundleAnalyzer([
    { name: 'lodash', size: 70000, dependencies: [] },
    { name: 'react', size: 45000, dependencies: [] },
    { name: 'app', size: 15000, dependencies: ['react', 'lodash'] },
  ]);
  assertEqual(analyzer.getSize('lodash'), 70000);
  assertEqual(analyzer.getSize('unknown'), 0);
  assertDeepEqual(analyzer.getDependencies('app'), ['react', 'lodash']);
  assertDeepEqual(analyzer.getDependencies('unknown'), []);
});

test('Ex3: getTotalSize et findHeaviest', () => {
  const analyzer = createBundleAnalyzer([
    { name: 'lodash', size: 70000, dependencies: [] },
    { name: 'react', size: 45000, dependencies: [] },
    { name: 'moment', size: 67000, dependencies: [] },
    { name: 'app', size: 15000, dependencies: [] },
  ]);
  assertEqual(analyzer.getTotalSize(), 197000);
  assertDeepEqual(analyzer.findHeaviest(2), ['lodash', 'moment']);
  assertDeepEqual(analyzer.findHeaviest(1), ['lodash']);
});

test('Ex3: suggestSplits regroupe les modules en chunks', () => {
  const analyzer = createBundleAnalyzer([
    { name: 'a', size: 30, dependencies: [] },
    { name: 'b', size: 25, dependencies: [] },
    { name: 'c', size: 40, dependencies: [] },
    { name: 'd', size: 10, dependencies: [] },
    { name: 'e', size: 20, dependencies: [] },
  ]);
  const splits = analyzer.suggestSplits(50);
  // a(30) + b(25) > 50 -> chunk1=[a], chunk2 starts with b
  // b(25) + c(40) > 50 -> chunk2=[b], chunk3 starts with c
  // c(40) + d(10) = 50 <= 50 -> chunk3=[c,d]
  // e(20) -> chunk3=[c,d]+e? 40+10+20=70 > 50 -> chunk4=[e]
  assertDeepEqual(splits, [['a'], ['b'], ['c', 'd'], ['e']]);
});

test('Ex3: suggestSplits avec un seul gros chunk', () => {
  const analyzer = createBundleAnalyzer([
    { name: 'a', size: 10, dependencies: [] },
    { name: 'b', size: 10, dependencies: [] },
    { name: 'c', size: 10, dependencies: [] },
  ]);
  const splits = analyzer.suggestSplits(100);
  assertDeepEqual(splits, [['a', 'b', 'c']]);
});

// --- Exercice 4 : createMemoryTracker ---

test('Ex4: allocate et release', () => {
  const tracker = createMemoryTracker();
  tracker.allocate('img-1', 1024);
  tracker.allocate('img-2', 2048);
  const usage = tracker.getUsage();
  assertEqual(usage.allocated, 3072);
  assertEqual(usage.released, 0);
  assertEqual(usage.current, 3072);

  tracker.release('img-1');
  const usage2 = tracker.getUsage();
  assertEqual(usage2.released, 1024);
  assertEqual(usage2.current, 2048);
});

test('Ex4: detectLeaks trouve les allocations anciennes non liberees', () => {
  const tracker = createMemoryTracker();
  // Allouer et manipuler les timestamps manuellement
  tracker.allocate('old-1', 100);
  tracker.allocate('old-2', 200);
  tracker.allocate('new-1', 300);

  // On simule le temps en verifiant que detectLeaks avec un grand maxAge
  // ne retourne rien (car tout est recent)
  const leaks = tracker.detectLeaks(999999999);
  assertLength(leaks, 0); // tout est recent

  // Liberer old-1
  tracker.release('old-1');

  // Meme avec maxAge = 0, old-1 est libere donc pas une fuite
  // old-2 et new-1 sont non-liberes mais recents
  // Avec maxAge tres grand, pas de fuites
  const leaks2 = tracker.detectLeaks(999999999);
  assertLength(leaks2, 0);
});

test('Ex4: erreur si double allocation ou liberation invalide', () => {
  const tracker = createMemoryTracker();
  tracker.allocate('img-1', 1024);

  let threw = false;
  try { tracker.allocate('img-1', 512); } catch { threw = true; }
  assertTrue(threw, 'Double allocation devrait lever une erreur');

  tracker.release('img-1');

  let threw2 = false;
  try { tracker.release('img-1'); } catch { threw2 = true; }
  assertTrue(threw2, 'Double liberation devrait lever une erreur');

  let threw3 = false;
  try { tracker.release('unknown'); } catch { threw3 = true; }
  assertTrue(threw3, 'Liberation d un id inconnu devrait lever une erreur');
});

test('Ex4: getAllocations retourne toutes les allocations', () => {
  const tracker = createMemoryTracker();
  tracker.allocate('a', 100);
  tracker.allocate('b', 200);
  tracker.release('a');
  const allocs = tracker.getAllocations();
  assertLength(allocs, 2);
  assertEqual(allocs[0].id, 'a');
  assertTrue(allocs[0].released);
  assertEqual(allocs[1].id, 'b');
  assertFalse(allocs[1].released);
});

// --- Exercice 5 : batchUpdates ---

test('Ex5: decoupe en lots de taille batchSize', () => {
  const updates = [
    { key: 'a', value: 1 },
    { key: 'b', value: 2 },
    { key: 'c', value: 3 },
    { key: 'd', value: 4 },
    { key: 'e', value: 5 },
  ];
  const batches = batchUpdates(updates, 2);
  assertLength(batches, 3);
  assertEqual(batches[0].batchCount, 1);
  assertEqual(batches[0].totalUpdates, 2);
  assertDeepEqual(batches[0].updates, [{ key: 'a', value: 1 }, { key: 'b', value: 2 }]);
  assertEqual(batches[1].batchCount, 2);
  assertEqual(batches[1].totalUpdates, 2);
  assertEqual(batches[2].batchCount, 3);
  assertEqual(batches[2].totalUpdates, 1);
  assertDeepEqual(batches[2].updates, [{ key: 'e', value: 5 }]);
});

test('Ex5: un seul lot si batchSize >= nombre d updates', () => {
  const updates = [
    { key: 'x', value: 10 },
    { key: 'y', value: 20 },
  ];
  const batches = batchUpdates(updates, 10);
  assertLength(batches, 1);
  assertEqual(batches[0].batchCount, 1);
  assertEqual(batches[0].totalUpdates, 2);
});

test('Ex5: tableau vide retourne un tableau vide', () => {
  const batches = batchUpdates([], 5);
  assertLength(batches, 0);
});

// =============================================================================
// Lancement
// =============================================================================

run();
