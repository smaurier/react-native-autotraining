// =============================================================================
// Lab 22 — Deploiement et CI/CD (Solution)
// =============================================================================
// Execution : npx tsx labs/lab-22-deploiement-ci-cd/solution.ts
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

const { test, run } = createTestRunner('Lab 22 — Deploiement et CI/CD (Solution)');

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
// =============================================================================

function createVersionManager(current: string): VersionManager {
  const parts = current.split('.').map(Number);
  const version: VersionInfo = {
    major: parts[0],
    minor: parts[1],
    patch: parts[2],
  };

  let buildNumber = 1;
  const history: string[] = [current];

  function formatVersion(): string {
    return `${version.major}.${version.minor}.${version.patch}`;
  }

  return {
    bump(type: 'major' | 'minor' | 'patch'): string {
      switch (type) {
        case 'major':
          version.major++;
          version.minor = 0;
          version.patch = 0;
          break;
        case 'minor':
          version.minor++;
          version.patch = 0;
          break;
        case 'patch':
          version.patch++;
          break;
      }
      buildNumber++;
      const v = formatVersion();
      history.push(v);
      return v;
    },

    getCurrent(): string {
      return formatVersion();
    },

    getBuildNumber(): number {
      return buildNumber;
    },

    getRuntimeVersion(): string {
      return `${version.major}.${version.minor}`;
    },

    getHistory(): string[] {
      return [...history];
    },
  };
}

// =============================================================================
// Exercice 2 : createBuildConfig
// =============================================================================

function createBuildConfig(platform: Platform, profile: BuildProfile): BuildConfig {
  const envMap: Record<BuildProfile, Record<string, string>> = {
    development: { APP_ENV: 'development', API_URL: 'http://localhost:3000' },
    preview: { APP_ENV: 'staging', API_URL: 'https://staging-api.myapp.com' },
    production: { APP_ENV: 'production', API_URL: 'https://api.myapp.com' },
  };

  const distributionMap: Record<BuildProfile, string> = {
    development: 'internal',
    preview: 'internal',
    production: 'store',
  };

  const channelMap: Record<BuildProfile, string> = {
    development: 'development',
    preview: 'preview',
    production: 'production',
  };

  const config: BuildConfig = {
    platform,
    profile,
    distribution: distributionMap[profile],
    env: envMap[profile],
    autoIncrement: profile !== 'development',
    channel: channelMap[profile],
  };

  if (platform === 'ios') {
    config.ios = {
      simulator: profile === 'development',
      buildConfiguration: profile === 'development' ? 'Debug' : 'Release',
    };
  }

  if (platform === 'android') {
    const androidConfigs: Record<BuildProfile, { buildType: string; gradleCommand: string }> = {
      development: { buildType: 'debug', gradleCommand: ':app:assembleDebug' },
      preview: { buildType: 'release', gradleCommand: ':app:assembleRelease' },
      production: { buildType: 'app-bundle', gradleCommand: ':app:bundleRelease' },
    };
    config.android = androidConfigs[profile];
  }

  return config;
}

// =============================================================================
// Exercice 3 : createReleaseChecklist
// =============================================================================

function createReleaseChecklist(_version: string): ReleaseChecklist {
  const items: ChecklistItem[] = [];

  function findItem(id: string): ChecklistItem {
    const item = items.find((i) => i.id === id);
    if (!item) throw new Error(`Item not found: ${id}`);
    return item;
  }

  return {
    addItem(id: string, label: string, blocking: boolean): void {
      if (items.some((i) => i.id === id)) {
        throw new Error(`Duplicate item: ${id}`);
      }
      items.push({ id, label, checked: false, blocking });
    },

    check(id: string): void {
      findItem(id).checked = true;
    },

    uncheck(id: string): void {
      findItem(id).checked = false;
    },

    isComplete(): boolean {
      return items.filter((i) => i.blocking).every((i) => i.checked);
    },

    getBlocking(): ChecklistItem[] {
      return items.filter((i) => i.blocking && !i.checked);
    },

    getProgress(): { checked: number; total: number; percentage: number } {
      const checked = items.filter((i) => i.checked).length;
      const total = items.length;
      const percentage = total === 0 ? 0 : Math.round((checked / total) * 100);
      return { checked, total, percentage };
    },
  };
}

// =============================================================================
// Exercice 4 : createUpdateChannel
// =============================================================================

function createUpdateChannel(name: string): UpdateChannel {
  const updates: UpdateEntry[] = [];
  let nextId = 1;

  return {
    publish(message: string, branch: string): UpdateEntry {
      const entry: UpdateEntry = {
        id: nextId++,
        message,
        branch,
        timestamp: Date.now(),
      };
      updates.push(entry);
      return entry;
    },

    rollback(): UpdateEntry | null {
      if (updates.length === 0) {
        throw new Error('No updates to rollback');
      }
      updates.pop();
      return updates.length > 0 ? { ...updates[updates.length - 1] } : null;
    },

    getHistory(): UpdateEntry[] {
      return updates.map((u) => ({ ...u }));
    },

    getCurrent(): UpdateEntry | null {
      if (updates.length === 0) return null;
      return { ...updates[updates.length - 1] };
    },

    getName(): string {
      return name;
    },
  };
}

// =============================================================================
// Exercice 5 : createCIPipeline
// =============================================================================

function createCIPipeline(
  stages: Array<{ name: string; execute: () => boolean; duration: number }>
): CIPipeline {
  const stageStates: PipelineStage[] = stages.map((s) => ({
    name: s.name,
    status: 'pending' as StageStatus,
    duration: s.duration,
  }));
  let hasRun = false;

  return {
    run(): PipelineStage[] {
      hasRun = true;
      let hasFailed = false;

      for (let i = 0; i < stages.length; i++) {
        if (hasFailed) {
          stageStates[i].status = 'skipped';
          stageStates[i].duration = 0;
          continue;
        }

        const success = stages[i].execute();
        if (success) {
          stageStates[i].status = 'passed';
        } else {
          stageStates[i].status = 'failed';
          hasFailed = true;
        }
      }

      return stageStates.map((s) => ({ ...s }));
    },

    getStatus(): 'pending' | 'passed' | 'failed' {
      if (!hasRun) return 'pending';
      return stageStates.some((s) => s.status === 'failed') ? 'failed' : 'passed';
    },

    getDuration(): number {
      return stageStates
        .filter((s) => s.status === 'passed' || s.status === 'failed')
        .reduce((sum, s) => sum + s.duration, 0);
    },

    getStages(): PipelineStage[] {
      return stageStates.map((s) => ({ ...s }));
    },

    getFailedStage(): string | null {
      const failed = stageStates.find((s) => s.status === 'failed');
      return failed ? failed.name : null;
    },
  };
}

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
  assertTrue(cl.isComplete());
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
  assertEqual(pipeline.getDuration(), 150);
  assertEqual(pipeline.getFailedStage(), 'Test');
});

test('Ex5 - getStages retourne l\'etat des stages', () => {
  const pipeline = createCIPipeline([
    { name: 'Check', execute: () => true, duration: 10 },
  ]);

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
