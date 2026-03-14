// =============================================================================
// Lab 22 — Deploiement et CI/CD (Exercice)
// =============================================================================
// Execution : npx tsx labs/lab-22-deploiement-ci-cd/exercise.ts
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

const { test, run } = createTestRunner('Lab 22 — Deploiement et CI/CD');

// =============================================================================
// Types
// =============================================================================

interface VersionInfo {
  major: number;
  minor: number;
  patch: number;
}

interface VersionManager {
  bump: (type: 'major' | 'minor' | 'patch') => string;
  getCurrent: () => string;
  getBuildNumber: () => number;
  getRuntimeVersion: () => string;
  getHistory: () => string[];
}

type Platform = 'ios' | 'android';
type BuildProfile = 'development' | 'preview' | 'production';

interface BuildConfig {
  platform: Platform;
  profile: BuildProfile;
  distribution: string;
  env: Record<string, string>;
  autoIncrement: boolean;
  channel: string;
  ios?: { simulator?: boolean; buildConfiguration?: string };
  android?: { buildType?: string; gradleCommand?: string };
}

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  blocking: boolean;
}

interface ReleaseChecklist {
  addItem: (id: string, label: string, blocking: boolean) => void;
  check: (id: string) => void;
  uncheck: (id: string) => void;
  isComplete: () => boolean;
  getBlocking: () => ChecklistItem[];
  getProgress: () => { checked: number; total: number; percentage: number };
}

interface UpdateEntry {
  id: number;
  message: string;
  branch: string;
  timestamp: number;
}

interface UpdateChannel {
  publish: (message: string, branch: string) => UpdateEntry;
  rollback: () => UpdateEntry | null;
  getHistory: () => UpdateEntry[];
  getCurrent: () => UpdateEntry | null;
  getName: () => string;
}

type StageStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped';

interface PipelineStage {
  name: string;
  status: StageStatus;
  duration: number;
}

interface CIPipeline {
  run: () => PipelineStage[];
  getStatus: () => 'pending' | 'passed' | 'failed';
  getDuration: () => number;
  getStages: () => PipelineStage[];
  getFailedStage: () => string | null;
}

// =============================================================================
// Exercice 1 : createVersionManager
// Gere le versioning semver avec build number et runtime version.
//
// createVersionManager(current) -> VersionManager
//
// current : string au format "MAJOR.MINOR.PATCH" (ex: "1.2.3")
//
// Regles :
// - bump('patch') : incremente PATCH, garde MAJOR et MINOR
// - bump('minor') : incremente MINOR, reset PATCH a 0
// - bump('major') : incremente MAJOR, reset MINOR et PATCH a 0
// - Chaque bump incremente le build number (commence a 1, +1 a chaque bump)
// - getCurrent() retourne la version actuelle "MAJOR.MINOR.PATCH"
// - getBuildNumber() retourne le build number courant
// - getRuntimeVersion() retourne "MAJOR.MINOR" (sans PATCH)
// - getHistory() retourne la liste des versions (incluant la version initiale)
// =============================================================================

// TODO: Implementez createVersionManager

// =============================================================================
// Exercice 2 : createBuildConfig
// Genere une configuration de build EAS selon la plateforme et le profil.
//
// createBuildConfig(platform, profile) -> BuildConfig
//
// Regles :
// - development :
//   → distribution: "internal"
//   → channel: "development"
//   → autoIncrement: false
//   → env: { APP_ENV: "development", API_URL: "http://localhost:3000" }
//   → ios.simulator: true, ios.buildConfiguration: "Debug"
//   → android.buildType: "debug", android.gradleCommand: ":app:assembleDebug"
//
// - preview :
//   → distribution: "internal"
//   → channel: "preview"
//   → autoIncrement: true
//   → env: { APP_ENV: "staging", API_URL: "https://staging-api.myapp.com" }
//   → ios.simulator: false, ios.buildConfiguration: "Release"
//   → android.buildType: "release", android.gradleCommand: ":app:assembleRelease"
//
// - production :
//   → distribution: "store"
//   → channel: "production"
//   → autoIncrement: true
//   → env: { APP_ENV: "production", API_URL: "https://api.myapp.com" }
//   → ios.simulator: false, ios.buildConfiguration: "Release"
//   → android.buildType: "app-bundle", android.gradleCommand: ":app:bundleRelease"
// =============================================================================

// TODO: Implementez createBuildConfig

// =============================================================================
// Exercice 3 : createReleaseChecklist
// Gere une checklist de pre-release avec items bloquants et non-bloquants.
//
// createReleaseChecklist(version) -> ReleaseChecklist
//
// Regles :
// - addItem(id, label, blocking) : ajoute un item. Erreur si id duplique.
// - check(id) : coche l'item. Erreur si id inexistant.
// - uncheck(id) : decoche l'item. Erreur si id inexistant.
// - isComplete() : true si tous les items BLOQUANTS sont coches
//   (les non-bloquants ne comptent pas pour la completion)
// - getBlocking() : retourne les items bloquants NON coches
// - getProgress() : { checked: nb coches, total: nb total, percentage: arrondi }
// =============================================================================

// TODO: Implementez createReleaseChecklist

// =============================================================================
// Exercice 4 : createUpdateChannel
// Simule un canal de mise a jour OTA (EAS Update).
//
// createUpdateChannel(name) -> UpdateChannel
//
// Regles :
// - publish(message, branch) : ajoute un update avec id auto-incremente
//   (premier id = 1), timestamp = Date.now(), retourne l'UpdateEntry
// - rollback() : supprime le dernier update et retourne l'update precedent
//   (qui devient le current). Retourne null si aucun update restant.
//   Erreur si pas d'historique ("No updates to rollback").
// - getHistory() : retourne tous les updates dans l'ordre chronologique
// - getCurrent() : retourne le dernier update, ou null si vide
// - getName() : retourne le nom du canal
// =============================================================================

// TODO: Implementez createUpdateChannel

// =============================================================================
// Exercice 5 : createCIPipeline
// Simule un pipeline CI/CD avec des stages sequentiels.
//
// createCIPipeline(stages) -> CIPipeline
//
// stages : Array<{ name: string, execute: () => boolean, duration: number }>
//
// Regles :
// - run() execute les stages dans l'ordre
//   → Si un stage echoue (execute retourne false), les suivants sont 'skipped'
//   → Un stage qui reussit a le status 'passed'
//   → Le stage qui echoue a le status 'failed'
//   → Les stages apres l'echec ont le status 'skipped' et duration 0
// - getStatus() :
//   → 'pending' si run() n'a pas ete appele
//   → 'passed' si tous les stages sont passes
//   → 'failed' si au moins un stage a echoue
// - getDuration() : somme des durations des stages executes (pas les skipped)
// - getStages() : retourne l'etat de tous les stages
// - getFailedStage() : nom du premier stage en echec, ou null
// =============================================================================

// TODO: Implementez createCIPipeline

// =============================================================================
// Tests
// =============================================================================

// ─── Exercice 1 : createVersionManager ────────────────────────────────────

test('Ex1 - bump patch, minor, major', () => {
  const vm = createVersionManager('1.2.3');
  assertEqual(vm.getCurrent(), '1.2.3');

  assertEqual(vm.bump('patch'), '1.2.4');
  assertEqual(vm.getCurrent(), '1.2.4');

  assertEqual(vm.bump('minor'), '1.3.0');
  assertEqual(vm.getCurrent(), '1.3.0');

  assertEqual(vm.bump('major'), '2.0.0');
  assertEqual(vm.getCurrent(), '2.0.0');
});

test('Ex1 - build number incremente a chaque bump', () => {
  const vm = createVersionManager('1.0.0');
  assertEqual(vm.getBuildNumber(), 1);

  vm.bump('patch');
  assertEqual(vm.getBuildNumber(), 2);

  vm.bump('minor');
  assertEqual(vm.getBuildNumber(), 3);

  vm.bump('major');
  assertEqual(vm.getBuildNumber(), 4);
});

test('Ex1 - runtime version et historique', () => {
  const vm = createVersionManager('1.2.3');
  assertEqual(vm.getRuntimeVersion(), '1.2');

  vm.bump('patch');
  assertEqual(vm.getRuntimeVersion(), '1.2');

  vm.bump('minor');
  assertEqual(vm.getRuntimeVersion(), '1.3');

  const history = vm.getHistory();
  assertDeepEqual(history, ['1.2.3', '1.2.4', '1.3.0']);
});

// ─── Exercice 2 : createBuildConfig ───────────────────────────────────────

test('Ex2 - config development iOS', () => {
  const config = createBuildConfig('ios', 'development');
  assertEqual(config.platform, 'ios');
  assertEqual(config.profile, 'development');
  assertEqual(config.distribution, 'internal');
  assertEqual(config.channel, 'development');
  assertFalse(config.autoIncrement);
  assertEqual(config.env.APP_ENV, 'development');
  assertEqual(config.env.API_URL, 'http://localhost:3000');
  assertTrue(config.ios?.simulator === true);
  assertEqual(config.ios?.buildConfiguration, 'Debug');
});

test('Ex2 - config preview Android', () => {
  const config = createBuildConfig('android', 'preview');
  assertEqual(config.platform, 'android');
  assertEqual(config.profile, 'preview');
  assertEqual(config.distribution, 'internal');
  assertEqual(config.channel, 'preview');
  assertTrue(config.autoIncrement);
  assertEqual(config.env.APP_ENV, 'staging');
  assertEqual(config.android?.buildType, 'release');
  assertEqual(config.android?.gradleCommand, ':app:assembleRelease');
});

test('Ex2 - config production Android utilise app-bundle', () => {
  const config = createBuildConfig('android', 'production');
  assertEqual(config.distribution, 'store');
  assertEqual(config.channel, 'production');
  assertTrue(config.autoIncrement);
  assertEqual(config.env.APP_ENV, 'production');
  assertEqual(config.android?.buildType, 'app-bundle');
  assertEqual(config.android?.gradleCommand, ':app:bundleRelease');
});

// ─── Exercice 3 : createReleaseChecklist ──────────────────────────────────

test('Ex3 - checklist avec items bloquants et non-bloquants', () => {
  const cl = createReleaseChecklist('1.0.0');
  cl.addItem('privacy', 'Politique de confidentialite', true);
  cl.addItem('screenshots', 'Screenshots a jour', true);
  cl.addItem('changelog', 'Changelog mis a jour', false);

  assertFalse(cl.isComplete());
  assertLength(cl.getBlocking(), 2);

  cl.check('privacy');
  cl.check('screenshots');
  assertTrue(cl.isComplete()); // changelog non-bloquant pas coche → OK
  assertLength(cl.getBlocking(), 0);
});

test('Ex3 - erreurs sur id duplique et inexistant', () => {
  const cl = createReleaseChecklist('1.0.0');
  cl.addItem('test', 'Test item', true);

  let error1 = '';
  try { cl.addItem('test', 'Duplicate', false); } catch (e) { error1 = (e as Error).message; }
  assertContains(error1, 'test');

  let error2 = '';
  try { cl.check('nonexistent'); } catch (e) { error2 = (e as Error).message; }
  assertContains(error2, 'nonexistent');
});

test('Ex3 - getProgress calcule le pourcentage', () => {
  const cl = createReleaseChecklist('1.0.0');
  cl.addItem('a', 'Item A', true);
  cl.addItem('b', 'Item B', true);
  cl.addItem('c', 'Item C', false);
  cl.addItem('d', 'Item D', false);

  const p0 = cl.getProgress();
  assertEqual(p0.checked, 0);
  assertEqual(p0.total, 4);
  assertEqual(p0.percentage, 0);

  cl.check('a');
  cl.check('c');
  const p1 = cl.getProgress();
  assertEqual(p1.checked, 2);
  assertEqual(p1.percentage, 50);
});

// ─── Exercice 4 : createUpdateChannel ─────────────────────────────────────

test('Ex4 - publish et getCurrent', () => {
  const channel = createUpdateChannel('production');
  assertEqual(channel.getName(), 'production');
  assertEqual(channel.getCurrent(), null);

  const u1 = channel.publish('Fix login bug', 'main');
  assertEqual(u1.id, 1);
  assertEqual(u1.message, 'Fix login bug');
  assertEqual(u1.branch, 'main');

  const u2 = channel.publish('Add dark mode', 'main');
  assertEqual(u2.id, 2);

  assertEqual(channel.getCurrent()?.id, 2);
  assertLength(channel.getHistory(), 2);
});

test('Ex4 - rollback revient a l\'update precedent', () => {
  const channel = createUpdateChannel('preview');
  channel.publish('v1', 'staging');
  channel.publish('v2', 'staging');
  channel.publish('v3', 'staging');

  assertEqual(channel.getCurrent()?.message, 'v3');

  const rolledBack = channel.rollback();
  assertEqual(rolledBack?.message, 'v2');
  assertEqual(channel.getCurrent()?.message, 'v2');
  assertLength(channel.getHistory(), 2);
});

test('Ex4 - rollback erreur si pas d\'historique', () => {
  const channel = createUpdateChannel('test');
  let error = '';
  try { channel.rollback(); } catch (e) { error = (e as Error).message; }
  assertEqual(error, 'No updates to rollback');
});

// ─── Exercice 5 : createCIPipeline ───────────────────────────────────────

test('Ex5 - pipeline complet qui reussit', () => {
  const pipeline = createCIPipeline([
    { name: 'Lint', execute: () => true, duration: 30 },
    { name: 'Test', execute: () => true, duration: 120 },
    { name: 'Build', execute: () => true, duration: 300 },
    { name: 'Deploy', execute: () => true, duration: 60 },
  ]);

  assertEqual(pipeline.getStatus(), 'pending');

  const stages = pipeline.run();
  assertLength(stages, 4);
  assertEqual(stages[0].status, 'passed');
  assertEqual(stages[3].status, 'passed');
  assertEqual(pipeline.getStatus(), 'passed');
  assertEqual(pipeline.getDuration(), 510);
  assertEqual(pipeline.getFailedStage(), null);
});

test('Ex5 - pipeline qui echoue au milieu', () => {
  const pipeline = createCIPipeline([
    { name: 'Lint', execute: () => true, duration: 30 },
    { name: 'Test', execute: () => false, duration: 120 },
    { name: 'Build', execute: () => true, duration: 300 },
    { name: 'Deploy', execute: () => true, duration: 60 },
  ]);

  const stages = pipeline.run();
  assertEqual(stages[0].status, 'passed');
  assertEqual(stages[1].status, 'failed');
  assertEqual(stages[2].status, 'skipped');
  assertEqual(stages[3].status, 'skipped');
  assertEqual(pipeline.getStatus(), 'failed');
  assertEqual(pipeline.getDuration(), 150); // 30 + 120, pas les skipped
  assertEqual(pipeline.getFailedStage(), 'Test');
});

test('Ex5 - getStages retourne l\'etat des stages', () => {
  const pipeline = createCIPipeline([
    { name: 'Check', execute: () => true, duration: 10 },
  ]);

  // Avant run, status pending
  const before = pipeline.getStages();
  assertLength(before, 1);
  assertEqual(before[0].status, 'pending');

  pipeline.run();
  const after = pipeline.getStages();
  assertEqual(after[0].status, 'passed');
  assertEqual(after[0].duration, 10);
});

// =============================================================================
run();
