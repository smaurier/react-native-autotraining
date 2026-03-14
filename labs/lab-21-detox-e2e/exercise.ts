// =============================================================================
// Lab 21 — Tests E2E avec Detox (Exercice)
// =============================================================================
// Execution : npx tsx labs/lab-21-detox-e2e/exercise.ts
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

const { test, run } = createTestRunner('Lab 21 — Tests E2E avec Detox');

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
// Cree un matcher qui verifie si un UIElement correspond au critere donne.
//
// createElementMatcher(type, value) -> {
//   matches: (element: UIElement) -> boolean,
//   findIn: (elements: UIElement[]) -> UIElement | undefined,
//   findAllIn: (elements: UIElement[]) -> UIElement[],
//   toString: () -> string
// }
//
// Regles :
// - type 'id' : match si element.id === value
// - type 'text' : match si element.text === value
// - type 'label' : match si element.label === value
// - type 'type' : match si element.type === value
// - findIn retourne le premier element qui match (profondeur d'abord si children)
// - findAllIn retourne tous les elements qui match (profondeur d'abord)
// - toString retourne "by.<type>('<value>')"
// =============================================================================

// TODO: Implementez createElementMatcher

// =============================================================================
// Exercice 2 : createTestFlow
// Cree un flux de test E2E a partir d'une liste d'etapes.
// Chaque etape est une fonction qui retourne true (succes) ou false (echec).
//
// createTestFlow(steps) -> TestFlow
//
// steps : Array<{ name: string, action: () => boolean, duration: number }>
//
// Regles :
// - execute() parcourt les etapes dans l'ordre
// - Si une etape echoue (action retourne false), les suivantes ne sont PAS executees
//   et sont marquees 'failed' avec error "Skipped: previous step failed"
// - L'etape qui echoue a pour error "Step failed: <name>"
// - getResults() retourne toutes les StepResult (apres execute)
// - getFailures() retourne uniquement les StepResult avec status 'failed'
// =============================================================================

// TODO: Implementez createTestFlow

// =============================================================================
// Exercice 3 : createDeviceSimulator
// Simule l'API device de Detox.
//
// createDeviceSimulator() -> DeviceSimulator
//
// Regles :
// - Etat initial : installed=false, launched=false, orientation='portrait',
//   reactNativeLoaded=false
// - installApp() : met installed=true. Si deja installe, pas d'erreur.
// - uninstallApp() : met installed=false, launched=false, reactNativeLoaded=false
// - launch() : met launched=true et reactNativeLoaded=true.
//   Erreur si pas installe ("App not installed").
// - reloadReactNative() : met reactNativeLoaded=false puis true (reload).
//   Erreur si pas lance ("App not launched").
// - setOrientation(o) : change l'orientation.
//   Erreur si pas lance ("App not launched").
// - sendToHome() : met launched=false (mais l'app reste installee et RN charge).
// - bringToForeground() : met launched=true.
//   Erreur si pas installe ("App not installed").
// - getState() retourne une copie de l'etat courant.
// =============================================================================

// TODO: Implementez createDeviceSimulator

// =============================================================================
// Exercice 4 : createWaitCondition
// Simule waitFor().withTimeout() de Detox.
//
// createWaitCondition(predicate, timeout, interval) -> WaitCondition
//
// predicate : () => boolean (condition a attendre)
// timeout : nombre max de "ticks" (pas du temps reel)
// interval : nombre de ticks entre chaque verification
//
// Regles :
// - check() appelle predicate une seule fois et retourne le resultat
// - waitFor() appelle predicate a chaque intervalle jusqu'au timeout
//   → Retourne { success: true, elapsed: ticks_ecoules, attempts: nb_appels }
//     si predicate retourne true avant le timeout
//   → Retourne { success: false, elapsed: timeout, attempts: nb_appels }
//     si timeout atteint sans succes
// - Le premier check se fait au tick 0
// - Puis a interval, 2*interval, 3*interval... jusqu'a timeout
// =============================================================================

// TODO: Implementez createWaitCondition

// =============================================================================
// Exercice 5 : createE2EReporter
// Genere un rapport a partir des resultats de tests E2E.
//
// createE2EReporter(tests) -> E2EReporter
//
// tests : Array<{ name: string, status: 'passed' | 'failed', duration: number }>
//
// Regles :
// - generateReport() retourne un E2EReport avec :
//   → total : nombre total de tests
//   → passed : nombre de tests passes
//   → failed : nombre de tests echoues
//   → passRate : pourcentage de tests passes (0-100), arrondi a 1 decimale
//   → duration : somme de toutes les durations
//   → slowTests : noms des tests avec duration > moyenne + 1 ecart-type
// - getPassRate() retourne le passRate (meme calcul)
// - getSlowTests(threshold) retourne les noms des tests avec duration > threshold
// =============================================================================

// TODO: Implementez createE2EReporter

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
  // tick 0 (attempt 1), tick 10 (attempt 2), tick 20 (attempt 3), tick 30 (attempt 4)
  assertEqual(result.elapsed, 30);
});

test('Ex4 - waitFor echoue au timeout', () => {
  const condition = createWaitCondition(() => false, 30, 10);

  const result = condition.waitFor();
  assertFalse(result.success);
  assertEqual(result.elapsed, 30);
  // tick 0, 10, 20, 30 → 4 attempts
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
