// =============================================================================
// Lab 25 — Hermes Engine et mode Bridgeless (Solutions)
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
  size: number;
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
  size: number;
  retainedBy: string[];
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
// =============================================================================

function analyzeBytecodeSize(modules: ModuleInfo[]): BytecodeAnalysis {
  const moduleMap = new Map<string, ModuleInfo>();
  for (const mod of modules) {
    moduleMap.set(mod.name, mod);
  }

  return {
    getTotal(): number {
      let total = 0;
      for (const mod of modules) {
        total += mod.size;
      }
      return total;
    },

    getByModule(name: string): number | undefined {
      return moduleMap.get(name)?.size;
    },

    suggestOptimizations(): string[] {
      const suggestions: string[] = [];

      // lazy-load pour modules > 100k
      for (const mod of modules) {
        if (mod.size > 100_000) {
          suggestions.push(`lazy-load:${mod.name}`);
        }
      }

      // tree-shake pour modules avec > 5 deps
      for (const mod of modules) {
        if (mod.dependencies.length > 5) {
          suggestions.push(`tree-shake:${mod.name}`);
        }
      }

      // code-split si total > 500k
      let total = 0;
      for (const mod of modules) {
        total += mod.size;
      }
      if (total > 500_000) {
        suggestions.push('code-split');
      }

      return suggestions;
    },
  };
}

// =============================================================================
// Exercice 2 : createHeapSnapshot
// =============================================================================

function createHeapSnapshot(objects: HeapObject[]): HeapSnapshot {
  const objectMap = new Map<string, HeapObject>();
  for (const obj of objects) {
    objectMap.set(obj.id, obj);
  }

  return {
    getSize(): number {
      let total = 0;
      for (const obj of objects) {
        total += obj.size;
      }
      return total;
    },

    findRetainers(objectId: string): string[] {
      const obj = objectMap.get(objectId);
      if (!obj) return [];
      return obj.retainedBy;
    },

    detectLeaks(): string[] {
      const leaks: string[] = [];

      for (const obj of objects) {
        // Detached objects
        if (obj.type === 'Detached') {
          leaks.push(obj.id);
          continue;
        }

        // Big objects with many retainers (circular reference)
        if (obj.size > 1_000_000 && obj.retainedBy.length >= 3) {
          leaks.push(obj.id);
        }
      }

      return leaks.sort();
    },
  };
}

// =============================================================================
// Exercice 3 : createProfiler
// =============================================================================

interface ProfilerWithAdd extends Profiler {
  addEntry(entry: FlameChartEntry): void;
}

function createProfiler(): ProfilerWithAdd {
  let running = false;
  const entries: FlameChartEntry[] = [];

  function collectHotPaths(entry: FlameChartEntry, threshold: number, result: Set<string>): void {
    if (entry.duration >= threshold) {
      result.add(entry.name);
    }
    for (const child of entry.children) {
      collectHotPaths(child, threshold, result);
    }
  }

  return {
    start(): void {
      running = true;
    },

    stop(): void {
      running = false;
    },

    addEntry(entry: FlameChartEntry): void {
      if (!running) {
        throw new Error('Profiler is not running');
      }
      entries.push(entry);
    },

    getFlameChart(): FlameChartEntry[] {
      return entries;
    },

    getHotPaths(threshold: number): string[] {
      const result = new Set<string>();
      for (const entry of entries) {
        collectHotPaths(entry, threshold, result);
      }
      return Array.from(result).sort();
    },
  };
}

// =============================================================================
// Exercice 4 : createStartupTracker
// =============================================================================

function createStartupTracker(phases: StartupPhase[]): StartupTracker {
  const phaseMap = new Map<string, StartupPhase>();
  for (const phase of phases) {
    phaseMap.set(phase.name, phase);
  }

  const starts = new Map<string, number>();
  const ends = new Map<string, number>();

  return {
    markStart(phase: string): void {
      if (!phaseMap.has(phase)) {
        throw new Error(`Unknown phase: ${phase}`);
      }
      if (starts.has(phase)) {
        throw new Error(`Phase already started: ${phase}`);
      }
      starts.set(phase, Date.now());
    },

    markEnd(phase: string): void {
      if (!starts.has(phase)) {
        throw new Error(`Phase not started: ${phase}`);
      }
      ends.set(phase, Date.now());
    },

    getTimeline(): PhaseTimeline[] {
      const timeline: PhaseTimeline[] = [];

      for (const [name, startTime] of starts) {
        const endTime = ends.get(name);
        if (endTime !== undefined) {
          const phaseInfo = phaseMap.get(name)!;
          timeline.push({
            phase: name,
            start: startTime,
            end: endTime,
            duration: endTime - startTime,
          });
        }
      }

      // Sort by phase order
      timeline.sort((a, b) => {
        const orderA = phaseMap.get(a.phase)!.order;
        const orderB = phaseMap.get(b.phase)!.order;
        return orderA - orderB;
      });

      return timeline;
    },

    getTotalTime(): number {
      const completedPhases: { start: number; end: number }[] = [];

      for (const [name, startTime] of starts) {
        const endTime = ends.get(name);
        if (endTime !== undefined) {
          completedPhases.push({ start: startTime, end: endTime });
        }
      }

      if (completedPhases.length === 0) return 0;

      let minStart = Infinity;
      let maxEnd = -Infinity;
      for (const phase of completedPhases) {
        if (phase.start < minStart) minStart = phase.start;
        if (phase.end > maxEnd) maxEnd = phase.end;
      }

      return maxEnd - minStart;
    },
  };
}

// =============================================================================
// Exercice 5 : createGCSimulator
// =============================================================================

function createGCSimulator(heapSize: number): GCSimulator {
  const allocations = new Map<string, AllocationRecord>();

  function getTotalAllocated(): number {
    let total = 0;
    for (const alloc of allocations.values()) {
      total += alloc.size;
    }
    return total;
  }

  return {
    allocate(id: string, size: number): void {
      if (size > heapSize) {
        throw new Error(`Allocation size ${size} exceeds heap size ${heapSize}`);
      }
      if (allocations.has(id)) {
        throw new Error(`Object ${id} already exists`);
      }
      allocations.set(id, { id, size, generation: 'young' });
    },

    collect(): GCResult {
      let collected = 0;
      let promoted = 0;

      const toDelete: string[] = [];
      const toPromote: string[] = [];

      for (const [id, alloc] of allocations) {
        if (alloc.generation === 'young') {
          if (id.startsWith('tmp')) {
            toDelete.push(id);
          } else {
            toPromote.push(id);
          }
        }
      }

      for (const id of toDelete) {
        allocations.delete(id);
        collected++;
      }

      for (const id of toPromote) {
        const alloc = allocations.get(id)!;
        alloc.generation = 'old';
        promoted++;
      }

      const fragmentation = Math.round((getTotalAllocated() / heapSize) * 100) / 100;

      return { collected, promoted, fragmentation };
    },

    getFragmentation(): number {
      return Math.round((getTotalAllocated() / heapSize) * 100) / 100;
    },
  };
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
  assertTrue(!leaks.includes('small'));
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
