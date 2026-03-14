// =============================================================================
// Lab 25 — Hermes Engine et mode Bridgeless (Exercices)
// =============================================================================

import {
  createTestRunner,
  assertEqual,
  assertDeepEqual,
  assertTrue,
  assertGreaterThan,
  assertLessThan,
  assertContains,
  assertArrayContains,
} from '../test-utils.ts';

// =============================================================================
// Types
// =============================================================================

interface ModuleInfo {
  name: string;
  size: number; // bytes
  dependencies: string[];
}

interface BytecodeAnalysis {
  getTotal(): number;
  getByModule(name: string): number | undefined;
  suggestOptimizations(): string[];
}

interface HeapObject {
  id: string;
  type: string;
  size: number; // bytes
  retainedBy: string[]; // ids des objets qui referent cet objet
}

interface HeapSnapshot {
  getSize(): number;
  findRetainers(objectId: string): string[];
  detectLeaks(): string[];
}

interface FlameChartEntry {
  name: string;
  duration: number;
  children: FlameChartEntry[];
}

interface Profiler {
  start(): void;
  stop(): void;
  getFlameChart(): FlameChartEntry[];
  getHotPaths(threshold: number): string[];
}

interface StartupPhase {
  name: string;
  order: number;
}

interface PhaseTimeline {
  phase: string;
  start: number;
  end: number;
  duration: number;
}

interface StartupTracker {
  markStart(phase: string): void;
  markEnd(phase: string): void;
  getTimeline(): PhaseTimeline[];
  getTotalTime(): number;
}

interface AllocationRecord {
  id: string;
  size: number;
  generation: 'young' | 'old';
}

interface GCResult {
  collected: number;
  promoted: number;
  fragmentation: number;
}

interface GCSimulator {
  allocate(id: string, size: number): void;
  collect(): GCResult;
  getFragmentation(): number;
}

// =============================================================================
// Exercice 1 : analyzeBytecodeSize
// Analyse la taille du bytecode par module.
// - getTotal() : somme de toutes les tailles
// - getByModule(name) : taille d'un module specifique (undefined si absent)
// - suggestOptimizations() : tableau de suggestions :
//   - Si un module > 100_000 bytes : "lazy-load:{name}"
//   - Si un module a > 5 dependances : "tree-shake:{name}"
//   - Si total > 500_000 bytes : "code-split"
//   Les suggestions doivent etre dans l'ordre ci-dessus
//   (d'abord tous les lazy-load, puis tree-shake, puis code-split).
// =============================================================================

function analyzeBytecodeSize(_modules: ModuleInfo[]): BytecodeAnalysis {
  // TODO: implementez l'analyse bytecode
  throw new Error('Not implemented');
}

// =============================================================================
// Exercice 2 : createHeapSnapshot
// Cree un snapshot du heap pour l'analyse memoire.
// - getSize() : somme de toutes les tailles d'objets
// - findRetainers(objectId) : retourne les retainedBy de l'objet
//   Si l'objet n'existe pas, retourne [].
// - detectLeaks() : retourne les ids des objets qui :
//   - Ont type === 'Detached' (DOM detache, listener orphelin)
//   - OU ont une taille > 1_000_000 bytes ET sont retenus par
//     au moins 3 autres objets (reference circulaire probable)
//   Retourne les ids tries par ordre alphabetique.
// =============================================================================

function createHeapSnapshot(_objects: HeapObject[]): HeapSnapshot {
  // TODO: implementez le heap snapshot
  throw new Error('Not implemented');
}

// =============================================================================
// Exercice 3 : createProfiler
// Cree un profiler qui enregistre des entrees de flame chart.
// - start() : demarre l'enregistrement (lance un "timer" interne,
//   on simule en stockant Date.now())
// - stop() : arrete l'enregistrement
// - getFlameChart() : retourne les entrees enregistrees via addEntry
//   (methode supplementaire a implementer)
// - getHotPaths(threshold) : retourne les noms des entrees dont
//   la duree >= threshold (recherche recursive dans l'arbre).
//   Resultat sans doublons, trie alphabetiquement.
//
// Ajoutez une methode addEntry(entry: FlameChartEntry) qui ajoute
// une entree au flame chart (utilisee par les tests).
// Si le profiler n'est pas demarre, addEntry lance une erreur.
// =============================================================================

interface ProfilerWithAdd extends Profiler {
  addEntry(entry: FlameChartEntry): void;
}

function createProfiler(): ProfilerWithAdd {
  // TODO: implementez le profiler
  throw new Error('Not implemented');
}

// =============================================================================
// Exercice 4 : createStartupTracker
// Suit les phases de demarrage d'une application.
// - Le constructeur recoit un tableau de phases avec nom et ordre.
// - markStart(phase) : enregistre le timestamp de debut (Date.now())
//   Lance une erreur si la phase est inconnue.
//   Lance une erreur si la phase est deja demarree.
// - markEnd(phase) : enregistre le timestamp de fin
//   Lance une erreur si la phase n'a pas ete demarree.
// - getTimeline() : retourne toutes les phases terminees,
//   triees par ordre croissant (champ order de la phase).
// - getTotalTime() : difference entre le plus petit start
//   et le plus grand end parmi les phases terminees.
//   Retourne 0 si aucune phase n'est terminee.
// =============================================================================

function createStartupTracker(_phases: StartupPhase[]): StartupTracker {
  // TODO: implementez le tracker de startup
  throw new Error('Not implemented');
}

// =============================================================================
// Exercice 5 : createGCSimulator
// Simule un garbage collector generationnel simplifie.
// - Le constructeur recoit heapSize (taille max du heap en bytes).
// - allocate(id, size) : alloue un objet dans la young generation.
//   Lance une erreur si la taille depasse heapSize.
//   Lance une erreur si l'id existe deja.
// - collect() : effectue une collecte :
//   1. Les objets young gen avec un id commencant par "tmp" sont collectes.
//   2. Les objets young gen survivants (id ne commencant PAS par "tmp")
//      sont promus vers l'old generation.
//   3. Retourne { collected, promoted, fragmentation }
//      - collected = nombre d'objets supprimes
//      - promoted = nombre d'objets promus
//      - fragmentation = (espace total alloue / heapSize)
//        arrondi a 2 decimales
// - getFragmentation() : retourne la fragmentation courante
//   (somme des tailles allouees / heapSize), arrondi a 2 decimales.
// =============================================================================

function createGCSimulator(_heapSize: number): GCSimulator {
  // TODO: implementez le simulateur GC
  throw new Error('Not implemented');
}

// =============================================================================
// Tests
// =============================================================================

const runner = createTestRunner('Lab 25 — Hermes Engine et mode Bridgeless');

// --- analyzeBytecodeSize ---

runner.test('analyzeBytecodeSize: getTotal somme toutes les tailles', () => {
  const analysis = analyzeBytecodeSize([
    { name: 'react', size: 120_000, dependencies: ['scheduler'] },
    { name: 'app', size: 80_000, dependencies: ['react', 'react-native'] },
  ]);
  assertEqual(analysis.getTotal(), 200_000);
});

runner.test('analyzeBytecodeSize: getByModule retourne la taille d\'un module', () => {
  const analysis = analyzeBytecodeSize([
    { name: 'react', size: 120_000, dependencies: ['scheduler'] },
    { name: 'app', size: 80_000, dependencies: [] },
  ]);
  assertEqual(analysis.getByModule('react'), 120_000);
});

runner.test('analyzeBytecodeSize: getByModule retourne undefined si absent', () => {
  const analysis = analyzeBytecodeSize([
    { name: 'app', size: 80_000, dependencies: [] },
  ]);
  assertEqual(analysis.getByModule('unknown'), undefined);
});

runner.test('analyzeBytecodeSize: suggestOptimizations lazy-load pour gros modules', () => {
  const analysis = analyzeBytecodeSize([
    { name: 'moment', size: 287_000, dependencies: [] },
    { name: 'app', size: 50_000, dependencies: [] },
  ]);
  const suggestions = analysis.suggestOptimizations();
  assertArrayContains(suggestions, 'lazy-load:moment');
});

runner.test('analyzeBytecodeSize: suggestOptimizations tree-shake pour deps > 5', () => {
  const analysis = analyzeBytecodeSize([
    { name: 'lodash', size: 50_000, dependencies: ['a', 'b', 'c', 'd', 'e', 'f'] },
  ]);
  const suggestions = analysis.suggestOptimizations();
  assertArrayContains(suggestions, 'tree-shake:lodash');
});

runner.test('analyzeBytecodeSize: suggestOptimizations code-split si total > 500k', () => {
  const analysis = analyzeBytecodeSize([
    { name: 'react', size: 300_000, dependencies: [] },
    { name: 'app', size: 250_000, dependencies: [] },
  ]);
  const suggestions = analysis.suggestOptimizations();
  assertArrayContains(suggestions, 'code-split');
});

// --- createHeapSnapshot ---

runner.test('createHeapSnapshot: getSize somme toutes les tailles', () => {
  const snapshot = createHeapSnapshot([
    { id: 'obj1', type: 'Object', size: 1000, retainedBy: [] },
    { id: 'obj2', type: 'Array', size: 2000, retainedBy: ['obj1'] },
  ]);
  assertEqual(snapshot.getSize(), 3000);
});

runner.test('createHeapSnapshot: findRetainers retourne les retainedBy', () => {
  const snapshot = createHeapSnapshot([
    { id: 'obj1', type: 'Object', size: 1000, retainedBy: ['root', 'obj3'] },
  ]);
  assertDeepEqual(snapshot.findRetainers('obj1'), ['root', 'obj3']);
});

runner.test('createHeapSnapshot: findRetainers retourne [] si objet absent', () => {
  const snapshot = createHeapSnapshot([]);
  assertDeepEqual(snapshot.findRetainers('missing'), []);
});

runner.test('createHeapSnapshot: detectLeaks trouve les objets Detached', () => {
  const snapshot = createHeapSnapshot([
    { id: 'detached1', type: 'Detached', size: 100, retainedBy: [] },
    { id: 'normal', type: 'Object', size: 100, retainedBy: [] },
  ]);
  const leaks = snapshot.detectLeaks();
  assertArrayContains(leaks, 'detached1');
  assertEqual(leaks.length, 1);
});

runner.test('createHeapSnapshot: detectLeaks trouve les gros objets avec references circulaires', () => {
  const snapshot = createHeapSnapshot([
    { id: 'big1', type: 'Object', size: 2_000_000, retainedBy: ['a', 'b', 'c'] },
    { id: 'small', type: 'Object', size: 100, retainedBy: ['a', 'b', 'c', 'd'] },
  ]);
  const leaks = snapshot.detectLeaks();
  assertArrayContains(leaks, 'big1');
  assertTrue(!leaks.includes('small')); // petit, meme si beaucoup de retainers
});

runner.test('createHeapSnapshot: detectLeaks trie alphabetiquement', () => {
  const snapshot = createHeapSnapshot([
    { id: 'z-detached', type: 'Detached', size: 100, retainedBy: [] },
    { id: 'a-detached', type: 'Detached', size: 100, retainedBy: [] },
  ]);
  const leaks = snapshot.detectLeaks();
  assertEqual(leaks[0], 'a-detached');
  assertEqual(leaks[1], 'z-detached');
});

// --- createProfiler ---

runner.test('createProfiler: start et stop sans erreur', () => {
  const profiler = createProfiler();
  profiler.start();
  profiler.stop();
  assertTrue(true);
});

runner.test('createProfiler: addEntry ajoute au flame chart', () => {
  const profiler = createProfiler();
  profiler.start();
  profiler.addEntry({ name: 'render', duration: 50, children: [] });
  profiler.stop();
  assertEqual(profiler.getFlameChart().length, 1);
  assertEqual(profiler.getFlameChart()[0].name, 'render');
});

runner.test('createProfiler: addEntry lance erreur si non demarre', () => {
  const profiler = createProfiler();
  let threw = false;
  try {
    profiler.addEntry({ name: 'test', duration: 10, children: [] });
  } catch {
    threw = true;
  }
  assertTrue(threw);
});

runner.test('createProfiler: getHotPaths trouve les entrees >= threshold', () => {
  const profiler = createProfiler();
  profiler.start();
  profiler.addEntry({
    name: 'root',
    duration: 200,
    children: [
      { name: 'fast', duration: 10, children: [] },
      { name: 'slow', duration: 150, children: [] },
    ],
  });
  profiler.stop();
  const hot = profiler.getHotPaths(100);
  assertArrayContains(hot, 'root');
  assertArrayContains(hot, 'slow');
  assertTrue(!hot.includes('fast'));
});

runner.test('createProfiler: getHotPaths trie alphabetiquement sans doublons', () => {
  const profiler = createProfiler();
  profiler.start();
  profiler.addEntry({ name: 'beta', duration: 100, children: [] });
  profiler.addEntry({ name: 'alpha', duration: 200, children: [] });
  profiler.stop();
  const hot = profiler.getHotPaths(50);
  assertEqual(hot[0], 'alpha');
  assertEqual(hot[1], 'beta');
});

// --- createStartupTracker ---

runner.test('createStartupTracker: markStart et markEnd enregistrent une phase', () => {
  const tracker = createStartupTracker([
    { name: 'native_init', order: 1 },
    { name: 'js_init', order: 2 },
  ]);
  tracker.markStart('native_init');
  tracker.markEnd('native_init');
  const timeline = tracker.getTimeline();
  assertEqual(timeline.length, 1);
  assertEqual(timeline[0].phase, 'native_init');
});

runner.test('createStartupTracker: markStart lance erreur pour phase inconnue', () => {
  const tracker = createStartupTracker([{ name: 'init', order: 1 }]);
  let threw = false;
  try {
    tracker.markStart('unknown');
  } catch {
    threw = true;
  }
  assertTrue(threw);
});

runner.test('createStartupTracker: markEnd lance erreur si pas demarree', () => {
  const tracker = createStartupTracker([{ name: 'init', order: 1 }]);
  let threw = false;
  try {
    tracker.markEnd('init');
  } catch {
    threw = true;
  }
  assertTrue(threw);
});

runner.test('createStartupTracker: getTimeline trie par order', () => {
  const tracker = createStartupTracker([
    { name: 'js_init', order: 2 },
    { name: 'native_init', order: 1 },
    { name: 'render', order: 3 },
  ]);
  tracker.markStart('js_init');
  tracker.markEnd('js_init');
  tracker.markStart('native_init');
  tracker.markEnd('native_init');
  tracker.markStart('render');
  tracker.markEnd('render');
  const timeline = tracker.getTimeline();
  assertEqual(timeline[0].phase, 'native_init');
  assertEqual(timeline[1].phase, 'js_init');
  assertEqual(timeline[2].phase, 'render');
});

runner.test('createStartupTracker: getTotalTime retourne la duree totale', () => {
  const tracker = createStartupTracker([
    { name: 'phase1', order: 1 },
    { name: 'phase2', order: 2 },
  ]);
  tracker.markStart('phase1');
  tracker.markEnd('phase1');
  tracker.markStart('phase2');
  tracker.markEnd('phase2');
  const total = tracker.getTotalTime();
  assertTrue(total >= 0);
});

runner.test('createStartupTracker: getTotalTime retourne 0 si aucune phase terminee', () => {
  const tracker = createStartupTracker([{ name: 'init', order: 1 }]);
  assertEqual(tracker.getTotalTime(), 0);
});

// --- createGCSimulator ---

runner.test('createGCSimulator: allocate ajoute un objet', () => {
  const gc = createGCSimulator(10_000);
  gc.allocate('obj1', 1000);
  assertGreaterThan(gc.getFragmentation(), 0);
});

runner.test('createGCSimulator: allocate lance erreur si taille > heapSize', () => {
  const gc = createGCSimulator(1000);
  let threw = false;
  try {
    gc.allocate('big', 2000);
  } catch {
    threw = true;
  }
  assertTrue(threw);
});

runner.test('createGCSimulator: allocate lance erreur si id duplique', () => {
  const gc = createGCSimulator(1_000_000);
  gc.allocate('obj1', 100);
  let threw = false;
  try {
    gc.allocate('obj1', 200);
  } catch {
    threw = true;
  }
  assertTrue(threw);
});

runner.test('createGCSimulator: collect supprime les objets tmp', () => {
  const gc = createGCSimulator(1_000_000);
  gc.allocate('tmp_1', 1000);
  gc.allocate('tmp_2', 2000);
  gc.allocate('keep_1', 500);
  const result = gc.collect();
  assertEqual(result.collected, 2);
  assertEqual(result.promoted, 1);
});

runner.test('createGCSimulator: collect met a jour la fragmentation', () => {
  const gc = createGCSimulator(10_000);
  gc.allocate('tmp_big', 5000);
  gc.allocate('keep', 1000);
  const before = gc.getFragmentation();
  gc.collect();
  const after = gc.getFragmentation();
  assertLessThan(after, before);
});

runner.test('createGCSimulator: getFragmentation calcule correctement', () => {
  const gc = createGCSimulator(10_000);
  gc.allocate('obj1', 2500);
  gc.allocate('obj2', 2500);
  assertEqual(gc.getFragmentation(), 0.5);
});

runner.run();
