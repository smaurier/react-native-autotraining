// =============================================================================
// Lab 21 — Tests E2E avec Detox (Solution)
// =============================================================================
// Execution : npx tsx labs/lab-21-detox-e2e/solution.ts
// =============================================================================

import {
  createTestRunner,
  assertEqual,
  assertDeepEqual,
  assertTrue,
  assertFalse,
  assertLength,
  assertContains,
  assertGreaterThan,
} from '../test-utils.ts';

const { test, run } = createTestRunner('Lab 21 — Tests E2E avec Detox (Solution)');

// =============================================================================
// Types
// =============================================================================

type MatcherType = 'id' | 'text' | 'label' | 'type';

interface ElementMatch {
  type: MatcherType;
  value: string;
}

interface UIElement {
  id?: string;
  text?: string;
  label?: string;
  type?: string;
  visible: boolean;
  toggleValue?: boolean;
  focused?: boolean;
  children?: UIElement[];
}

interface StepResult {
  step: string;
  status: 'passed' | 'failed';
  duration: number;
  error?: string;
}

interface TestFlow {
  execute: () => StepResult[];
  getResults: () => StepResult[];
  getFailures: () => StepResult[];
}

interface DeviceState {
  installed: boolean;
  launched: boolean;
  orientation: 'portrait' | 'landscape';
  reactNativeLoaded: boolean;
}

interface DeviceSimulator {
  launch: () => void;
  reloadReactNative: () => void;
  installApp: () => void;
  uninstallApp: () => void;
  setOrientation: (orientation: 'portrait' | 'landscape') => void;
  sendToHome: () => void;
  bringToForeground: () => void;
  getState: () => DeviceState;
}

interface WaitCondition {
  check: () => boolean;
  waitFor: () => { success: boolean; elapsed: number; attempts: number };
}

interface E2EReport {
  total: number;
  passed: number;
  failed: number;
  passRate: number;
  duration: number;
  slowTests: string[];
}

interface E2EReporter {
  generateReport: () => E2EReport;
  getPassRate: () => number;
  getSlowTests: (threshold: number) => string[];
}

// =============================================================================
// Exercice 1 : createElementMatcher
// =============================================================================

function createElementMatcher(type: MatcherType, value: string) {
  function matches(el: UIElement): boolean {
    switch (type) {
      case 'id': return el.id === value;
      case 'text': return el.text === value;
      case 'label': return el.label === value;
      case 'type': return el.type === value;
    }
  }

  function findInElement(el: UIElement): UIElement | undefined {
    if (matches(el)) return el;
    if (el.children) {
      for (const child of el.children) {
        const found = findInElement(child);
        if (found) return found;
      }
    }
    return undefined;
  }

  function findAllInElement(el: UIElement): UIElement[] {
    const results: UIElement[] = [];
    if (matches(el)) results.push(el);
    if (el.children) {
      for (const child of el.children) {
        results.push(...findAllInElement(child));
      }
    }
    return results;
  }

  return {
    matches,

    findIn(elements: UIElement[]): UIElement | undefined {
      for (const el of elements) {
        const found = findInElement(el);
        if (found) return found;
      }
      return undefined;
    },

    findAllIn(elements: UIElement[]): UIElement[] {
      const results: UIElement[] = [];
      for (const el of elements) {
        results.push(...findAllInElement(el));
      }
      return results;
    },

    toString(): string {
      return `by.${type}('${value}')`;
    },
  };
}

// =============================================================================
// Exercice 2 : createTestFlow
// =============================================================================

function createTestFlow(
  steps: Array<{ name: string; action: () => boolean; duration: number }>
): TestFlow {
  let results: StepResult[] = [];

  return {
    execute(): StepResult[] {
      results = [];
      let hasFailed = false;

      for (const step of steps) {
        if (hasFailed) {
          results.push({
            step: step.name,
            status: 'failed',
            duration: step.duration,
            error: 'Skipped: previous step failed',
          });
          continue;
        }

        const success = step.action();
        if (success) {
          results.push({
            step: step.name,
            status: 'passed',
            duration: step.duration,
          });
        } else {
          hasFailed = true;
          results.push({
            step: step.name,
            status: 'failed',
            duration: step.duration,
            error: `Step failed: ${step.name}`,
          });
        }
      }

      return results;
    },

    getResults(): StepResult[] {
      return results;
    },

    getFailures(): StepResult[] {
      return results.filter((r) => r.status === 'failed');
    },
  };
}

// =============================================================================
// Exercice 3 : createDeviceSimulator
// =============================================================================

function createDeviceSimulator(): DeviceSimulator {
  const state: DeviceState = {
    installed: false,
    launched: false,
    orientation: 'portrait',
    reactNativeLoaded: false,
  };

  return {
    installApp() {
      state.installed = true;
    },

    uninstallApp() {
      state.installed = false;
      state.launched = false;
      state.reactNativeLoaded = false;
    },

    launch() {
      if (!state.installed) throw new Error('App not installed');
      state.launched = true;
      state.reactNativeLoaded = true;
    },

    reloadReactNative() {
      if (!state.launched) throw new Error('App not launched');
      state.reactNativeLoaded = false;
      state.reactNativeLoaded = true;
    },

    setOrientation(orientation: 'portrait' | 'landscape') {
      if (!state.launched) throw new Error('App not launched');
      state.orientation = orientation;
    },

    sendToHome() {
      state.launched = false;
    },

    bringToForeground() {
      if (!state.installed) throw new Error('App not installed');
      state.launched = true;
    },

    getState(): DeviceState {
      return { ...state };
    },
  };
}

// =============================================================================
// Exercice 4 : createWaitCondition
// =============================================================================

function createWaitCondition(
  predicate: () => boolean,
  timeout: number,
  interval: number,
): WaitCondition {
  return {
    check(): boolean {
      return predicate();
    },

    waitFor(): { success: boolean; elapsed: number; attempts: number } {
      let elapsed = 0;
      let attempts = 0;

      while (elapsed <= timeout) {
        attempts++;
        if (predicate()) {
          return { success: true, elapsed, attempts };
        }
        elapsed += interval;
      }

      return { success: false, elapsed: timeout, attempts };
    },
  };
}

// =============================================================================
// Exercice 5 : createE2EReporter
// =============================================================================

function createE2EReporter(
  tests: Array<{ name: string; status: 'passed' | 'failed'; duration: number }>
): E2EReporter {
  function computePassRate(): number {
    if (tests.length === 0) return 0;
    const passed = tests.filter((t) => t.status === 'passed').length;
    return Math.round((passed / tests.length) * 1000) / 10;
  }

  function computeSlowTestsByStdDev(): string[] {
    if (tests.length === 0) return [];
    const durations = tests.map((t) => t.duration);
    const mean = durations.reduce((a, b) => a + b, 0) / durations.length;
    const variance =
      durations.reduce((sum, d) => sum + (d - mean) ** 2, 0) / durations.length;
    const stdDev = Math.sqrt(variance);
    const threshold = mean + stdDev;
    return tests.filter((t) => t.duration > threshold).map((t) => t.name);
  }

  return {
    generateReport(): E2EReport {
      const passed = tests.filter((t) => t.status === 'passed').length;
      const failed = tests.filter((t) => t.status === 'failed').length;
      const duration = tests.reduce((sum, t) => sum + t.duration, 0);

      return {
        total: tests.length,
        passed,
        failed,
        passRate: computePassRate(),
        duration,
        slowTests: computeSlowTestsByStdDev(),
      };
    },

    getPassRate(): number {
      return computePassRate();
    },

    getSlowTests(threshold: number): string[] {
      return tests.filter((t) => t.duration > threshold).map((t) => t.name);
    },
  };
}

// =============================================================================
// Tests
// =============================================================================

// ─── Exercice 1 : createElementMatcher ─────────────────────────────────────

test('Ex1 - matcher by.id trouve un element par id', () => {
  const matcher = createElementMatcher('id', 'login-btn');
  const elements: UIElement[] = [
    { id: 'email-input', text: 'Email', visible: true },
    { id: 'login-btn', text: 'Se connecter', visible: true },
    { id: 'register-link', text: 'Inscription', visible: false },
  ];

  assertTrue(matcher.matches(elements[1]));
  assertFalse(matcher.matches(elements[0]));

  const found = matcher.findIn(elements);
  assertEqual(found?.id, 'login-btn');
  assertEqual(matcher.toString(), "by.id('login-btn')");
});

test('Ex1 - matcher by.text cherche en profondeur dans les children', () => {
  const matcher = createElementMatcher('text', 'Valider');
  const elements: UIElement[] = [
    {
      id: 'form',
      visible: true,
      children: [
        { id: 'input', text: 'Nom', visible: true },
        {
          id: 'footer',
          visible: true,
          children: [
            { id: 'submit', text: 'Valider', visible: true },
          ],
        },
      ],
    },
  ];

  const found = matcher.findIn(elements);
  assertEqual(found?.id, 'submit');
});

test('Ex1 - findAllIn retourne tous les elements correspondants', () => {
  const matcher = createElementMatcher('type', 'Button');
  const elements: UIElement[] = [
    { id: 'btn1', type: 'Button', visible: true },
    { id: 'input1', type: 'TextInput', visible: true },
    {
      id: 'container', visible: true, children: [
        { id: 'btn2', type: 'Button', visible: true },
        { id: 'btn3', type: 'Button', visible: false },
      ],
    },
  ];

  const all = matcher.findAllIn(elements);
  assertLength(all, 3);
  assertEqual(all[0].id, 'btn1');
  assertEqual(all[1].id, 'btn2');
  assertEqual(all[2].id, 'btn3');
});

// ─── Exercice 2 : createTestFlow ──────────────────────────────────────────

test('Ex2 - execute un flow avec toutes les etapes reussies', () => {
  const flow = createTestFlow([
    { name: 'Ouvrir app', action: () => true, duration: 100 },
    { name: 'Tap login', action: () => true, duration: 50 },
    { name: 'Saisir email', action: () => true, duration: 80 },
  ]);

  const results = flow.execute();
  assertLength(results, 3);
  assertEqual(results[0].status, 'passed');
  assertEqual(results[1].status, 'passed');
  assertEqual(results[2].status, 'passed');
  assertLength(flow.getFailures(), 0);
});

test('Ex2 - arrete l\'execution apres un echec', () => {
  const flow = createTestFlow([
    { name: 'Ouvrir app', action: () => true, duration: 100 },
    { name: 'Tap login', action: () => false, duration: 50 },
    { name: 'Saisir email', action: () => true, duration: 80 },
    { name: 'Valider', action: () => true, duration: 60 },
  ]);

  const results = flow.execute();
  assertLength(results, 4);
  assertEqual(results[0].status, 'passed');
  assertEqual(results[1].status, 'failed');
  assertEqual(results[1].error, 'Step failed: Tap login');
  assertEqual(results[2].status, 'failed');
  assertEqual(results[2].error, 'Skipped: previous step failed');
  assertEqual(results[3].status, 'failed');
  assertLength(flow.getFailures(), 3);
});

test('Ex2 - getResults retourne les resultats apres execution', () => {
  const flow = createTestFlow([
    { name: 'Etape unique', action: () => true, duration: 200 },
  ]);

  // Avant execution, pas de resultats
  assertLength(flow.getResults(), 0);

  flow.execute();
  assertLength(flow.getResults(), 1);
  assertEqual(flow.getResults()[0].step, 'Etape unique');
  assertEqual(flow.getResults()[0].duration, 200);
});

// ─── Exercice 3 : createDeviceSimulator ───────────────────────────────────

test('Ex3 - cycle de vie install -> launch -> reload', () => {
  const device = createDeviceSimulator();
  const initial = device.getState();
  assertFalse(initial.installed);
  assertFalse(initial.launched);

  device.installApp();
  assertTrue(device.getState().installed);

  device.launch();
  assertTrue(device.getState().launched);
  assertTrue(device.getState().reactNativeLoaded);

  device.reloadReactNative();
  assertTrue(device.getState().reactNativeLoaded);
});

test('Ex3 - erreur si launch sans install', () => {
  const device = createDeviceSimulator();
  let error = '';
  try {
    device.launch();
  } catch (e) {
    error = (e as Error).message;
  }
  assertEqual(error, 'App not installed');
});

test('Ex3 - sendToHome et bringToForeground', () => {
  const device = createDeviceSimulator();
  device.installApp();
  device.launch();
  assertEqual(device.getState().orientation, 'portrait');

  device.setOrientation('landscape');
  assertEqual(device.getState().orientation, 'landscape');

  device.sendToHome();
  assertFalse(device.getState().launched);

  device.bringToForeground();
  assertTrue(device.getState().launched);
});

test('Ex3 - uninstallApp reset complet', () => {
  const device = createDeviceSimulator();
  device.installApp();
  device.launch();
  device.uninstallApp();

  const state = device.getState();
  assertFalse(state.installed);
  assertFalse(state.launched);
  assertFalse(state.reactNativeLoaded);
});

// ─── Exercice 4 : createWaitCondition ─────────────────────────────────────

test('Ex4 - check retourne le resultat du predicat', () => {
  let counter = 0;
  const condition = createWaitCondition(() => {
    counter++;
    return counter >= 3;
  }, 100, 10);

  assertFalse(condition.check()); // counter=1
  assertFalse(condition.check()); // counter=2
  assertTrue(condition.check());  // counter=3
});

test('Ex4 - waitFor reussit quand le predicat devient vrai', () => {
  let tick = 0;
  const condition = createWaitCondition(() => {
    tick++;
    return tick >= 4;
  }, 100, 10);

  const result = condition.waitFor();
  assertTrue(result.success);
  assertEqual(result.attempts, 4);
  assertEqual(result.elapsed, 30);
});

test('Ex4 - waitFor echoue au timeout', () => {
  const condition = createWaitCondition(() => false, 30, 10);

  const result = condition.waitFor();
  assertFalse(result.success);
  assertEqual(result.elapsed, 30);
  assertEqual(result.attempts, 4);
});

// ─── Exercice 5 : createE2EReporter ──────────────────────────────────────

test('Ex5 - generateReport calcule les statistiques', () => {
  const reporter = createE2EReporter([
    { name: 'Login', status: 'passed', duration: 1200 },
    { name: 'Navigation', status: 'passed', duration: 800 },
    { name: 'Form', status: 'failed', duration: 500 },
    { name: 'Logout', status: 'passed', duration: 600 },
  ]);

  const report = reporter.generateReport();
  assertEqual(report.total, 4);
  assertEqual(report.passed, 3);
  assertEqual(report.failed, 1);
  assertEqual(report.passRate, 75.0);
  assertEqual(report.duration, 3100);
});

test('Ex5 - getPassRate retourne le pourcentage', () => {
  const reporter = createE2EReporter([
    { name: 'Test1', status: 'passed', duration: 100 },
    { name: 'Test2', status: 'passed', duration: 200 },
    { name: 'Test3', status: 'failed', duration: 300 },
  ]);

  const rate = reporter.getPassRate();
  assertEqual(rate, 66.7);
});

test('Ex5 - getSlowTests filtre par seuil', () => {
  const reporter = createE2EReporter([
    { name: 'Fast', status: 'passed', duration: 100 },
    { name: 'Medium', status: 'passed', duration: 500 },
    { name: 'Slow', status: 'passed', duration: 2000 },
    { name: 'VerySlow', status: 'failed', duration: 5000 },
  ]);

  const slow = reporter.getSlowTests(1000);
  assertLength(slow, 2);
  assertDeepEqual(slow, ['Slow', 'VerySlow']);
});

// =============================================================================
run();
