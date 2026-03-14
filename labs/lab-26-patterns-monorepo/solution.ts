// =============================================================================
// Lab 26 — Patterns avances et Monorepo (Solutions)
// =============================================================================

import {
  createTestRunner,
  assertEqual,
  assertDeepEqual,
  assertTrue,
  assertGreaterThan,
  assertArrayContains,
  assertContains,
} from '../test-utils.ts';

// =============================================================================
// Types
// =============================================================================

interface PackageInfo {
  name: string;
  version: string;
  dependencies: string[];
}

interface DependencyGraph {
  [packageName: string]: string[];
}

interface WorkspaceResolver {
  resolve(name: string): PackageInfo | undefined;
  getDependencyGraph(): DependencyGraph;
  findCircular(): string[][];
}

interface ChangeInfo {
  package: string;
  files: string[];
}

interface AffectedFilter {
  getAffected(): string[];
  shouldBuild(packageName: string): boolean;
  shouldTest(packageName: string): boolean;
}

interface DesignToken {
  name: string;
  value: string | number;
  category: 'color' | 'spacing' | 'fontSize' | 'radius';
}

interface DesignTokenPipeline {
  transform(platform: 'css' | 'rn'): Record<string, string | number>;
  generateCSS(): string;
  generateRN(): string;
  validate(): string[];
}

interface PackageVersion {
  name: string;
  currentVersion: string;
  bump: 'patch' | 'minor' | 'major';
}

interface PublishResult {
  name: string;
  version: string;
  success: boolean;
}

interface PackagePublisher {
  version(pkg: string, bump: 'patch' | 'minor' | 'major'): string;
  publish(pkg: string): PublishResult;
  getChangelog(pkg: string): string[];
}

interface CacheEntry {
  key: string;
  hash: string;
  output: string;
  timestamp: number;
}

interface BuildCache {
  get(key: string): CacheEntry | undefined;
  set(key: string, hash: string, output: string): void;
  invalidate(key: string): boolean;
  getHitRate(): number;
}

// =============================================================================
// Exercice 1 : createWorkspaceResolver
// =============================================================================

function createWorkspaceResolver(packages: PackageInfo[]): WorkspaceResolver {
  const packageMap = new Map<string, PackageInfo>();
  for (const pkg of packages) {
    packageMap.set(pkg.name, pkg);
  }

  return {
    resolve(name: string): PackageInfo | undefined {
      return packageMap.get(name);
    },

    getDependencyGraph(): DependencyGraph {
      const graph: DependencyGraph = {};
      for (const pkg of packages) {
        graph[pkg.name] = [...pkg.dependencies];
      }
      return graph;
    },

    findCircular(): string[][] {
      const graph = this.getDependencyGraph();
      const visited = new Set<string>();
      const inStack = new Set<string>();
      const cycles: string[][] = [];
      const cycleSet = new Set<string>(); // to deduplicate

      function dfs(node: string, path: string[]): void {
        if (inStack.has(node)) {
          // Found a cycle
          const cycleStart = path.indexOf(node);
          const cycle = path.slice(cycleStart).sort();
          const cycleKey = cycle.join(',');
          if (!cycleSet.has(cycleKey)) {
            cycleSet.add(cycleKey);
            cycles.push(cycle);
          }
          return;
        }
        if (visited.has(node)) return;

        visited.add(node);
        inStack.add(node);
        path.push(node);

        const deps = graph[node] || [];
        for (const dep of deps) {
          dfs(dep, [...path]);
        }

        inStack.delete(node);
      }

      for (const pkg of packages) {
        visited.clear();
        inStack.clear();
        dfs(pkg.name, []);
      }

      // Sort cycles by first element
      cycles.sort((a, b) => a[0].localeCompare(b[0]));
      return cycles;
    },
  };
}

// =============================================================================
// Exercice 2 : createAffectedFilter
// =============================================================================

function createAffectedFilter(changes: ChangeInfo[], graph: DependencyGraph): AffectedFilter {
  // Build reverse dependency graph (dependants)
  const dependants: DependencyGraph = {};
  for (const pkg of Object.keys(graph)) {
    dependants[pkg] = [];
  }
  for (const [pkg, deps] of Object.entries(graph)) {
    for (const dep of deps) {
      if (!dependants[dep]) dependants[dep] = [];
      dependants[dep].push(pkg);
    }
  }

  // Find all affected packages (changed + transitive dependants)
  const changedPackages = new Set(changes.map((c) => c.package));
  const affected = new Set<string>();

  function markAffected(pkg: string): void {
    if (affected.has(pkg)) return;
    affected.add(pkg);
    // Mark all packages that depend on this one
    const deps = dependants[pkg] || [];
    for (const dep of deps) {
      markAffected(dep);
    }
  }

  for (const pkg of changedPackages) {
    markAffected(pkg);
  }

  return {
    getAffected(): string[] {
      return Array.from(affected).sort();
    },

    shouldBuild(packageName: string): boolean {
      return affected.has(packageName);
    },

    shouldTest(packageName: string): boolean {
      if (affected.has(packageName)) return true;
      // Also test if any direct dependant is affected
      const pkgDependants = dependants[packageName] || [];
      for (const dep of pkgDependants) {
        if (affected.has(dep)) return true;
      }
      return false;
    },
  };
}

// =============================================================================
// Exercice 3 : createDesignTokenPipeline
// =============================================================================

function createDesignTokenPipeline(tokens: DesignToken[]): DesignTokenPipeline {
  const sorted = [...tokens].sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.name.localeCompare(b.name);
  });

  function toCSSKey(token: DesignToken): string {
    return `--${token.category}-${token.name}`;
  }

  function toRNKey(token: DesignToken): string {
    const cat = token.category;
    const name = token.name.charAt(0).toUpperCase() + token.name.slice(1);
    return `${cat}${name}`;
  }

  return {
    transform(platform: 'css' | 'rn'): Record<string, string | number> {
      const result: Record<string, string | number> = {};
      for (const token of sorted) {
        if (platform === 'css') {
          result[toCSSKey(token)] = token.value;
        } else {
          result[toRNKey(token)] = token.value;
        }
      }
      return result;
    },

    generateCSS(): string {
      let css = ':root {\n';
      for (const token of sorted) {
        css += `  ${toCSSKey(token)}: ${token.value};\n`;
      }
      css += '}\n';
      return css;
    },

    generateRN(): string {
      let ts = 'export const tokens = {\n';
      for (const token of sorted) {
        const key = toRNKey(token);
        const value = typeof token.value === 'string' ? `"${token.value}"` : token.value;
        ts += `  ${key}: ${value},\n`;
      }
      ts += '} as const;\n';
      return ts;
    },

    validate(): string[] {
      const errors: string[] = [];
      for (const token of tokens) {
        switch (token.category) {
          case 'color':
            if (typeof token.value !== 'string' || !token.value.startsWith('#')) {
              errors.push(`Invalid color: ${token.name} (${token.value})`);
            }
            break;
          case 'spacing':
            if (typeof token.value !== 'number' || token.value <= 0) {
              errors.push(`Invalid spacing: ${token.name} (${token.value})`);
            }
            break;
          case 'fontSize':
            if (typeof token.value !== 'number' || token.value <= 0) {
              errors.push(`Invalid fontSize: ${token.name} (${token.value})`);
            }
            break;
          case 'radius':
            if (typeof token.value !== 'number' || token.value < 0) {
              errors.push(`Invalid radius: ${token.name} (${token.value})`);
            }
            break;
        }
      }
      return errors;
    },
  };
}

// =============================================================================
// Exercice 4 : createPackagePublisher
// =============================================================================

function createPackagePublisher(packages: PackageVersion[]): PackagePublisher {
  const versionMap = new Map<string, string>();
  const changelog = new Map<string, string[]>();
  const bumped = new Set<string>();

  for (const pkg of packages) {
    versionMap.set(pkg.name, pkg.currentVersion);
    changelog.set(pkg.name, []);
  }

  function bumpVersion(version: string, bump: 'patch' | 'minor' | 'major'): string {
    const parts = version.split('.').map(Number);
    switch (bump) {
      case 'patch':
        parts[2]++;
        break;
      case 'minor':
        parts[1]++;
        parts[2] = 0;
        break;
      case 'major':
        parts[0]++;
        parts[1] = 0;
        parts[2] = 0;
        break;
    }
    return parts.join('.');
  }

  return {
    version(pkg: string, bump: 'patch' | 'minor' | 'major'): string {
      const currentVersion = versionMap.get(pkg);
      if (currentVersion === undefined) {
        throw new Error(`Unknown package: ${pkg}`);
      }
      const newVersion = bumpVersion(currentVersion, bump);
      changelog.get(pkg)!.push(`${currentVersion} -> ${newVersion} (${bump})`);
      versionMap.set(pkg, newVersion);
      bumped.add(pkg);
      return newVersion;
    },

    publish(pkg: string): PublishResult {
      const version = versionMap.get(pkg);
      if (version === undefined) {
        throw new Error(`Unknown package: ${pkg}`);
      }
      return {
        name: pkg,
        version,
        success: bumped.has(pkg),
      };
    },

    getChangelog(pkg: string): string[] {
      const log = changelog.get(pkg);
      if (log === undefined) {
        throw new Error(`Unknown package: ${pkg}`);
      }
      return log;
    },
  };
}

// =============================================================================
// Exercice 5 : createBuildCache
// =============================================================================

function createBuildCache(): BuildCache {
  const entries = new Map<string, CacheEntry>();
  let hits = 0;
  let lookups = 0;

  return {
    get(key: string): CacheEntry | undefined {
      lookups++;
      const entry = entries.get(key);
      if (entry) {
        hits++;
      }
      return entry;
    },

    set(key: string, hash: string, output: string): void {
      entries.set(key, { key, hash, output, timestamp: Date.now() });
    },

    invalidate(key: string): boolean {
      return entries.delete(key);
    },

    getHitRate(): number {
      if (lookups === 0) return 0;
      return Math.round((hits / lookups) * 100) / 100;
    },
  };
}

// =============================================================================
// Tests
// =============================================================================

const runner = createTestRunner('Lab 26 — Patterns avances et Monorepo');

// --- createWorkspaceResolver ---

runner.test('createWorkspaceResolver: resolve trouve un package', () => {
  const resolver = createWorkspaceResolver([
    { name: '@mono/ui', version: '1.0.0', dependencies: ['@mono/tokens'] },
    { name: '@mono/tokens', version: '1.0.0', dependencies: [] },
  ]);
  const pkg = resolver.resolve('@mono/ui');
  assertEqual(pkg?.name, '@mono/ui');
  assertEqual(pkg?.version, '1.0.0');
});

runner.test('createWorkspaceResolver: resolve retourne undefined si absent', () => {
  const resolver = createWorkspaceResolver([]);
  assertEqual(resolver.resolve('@mono/unknown'), undefined);
});

runner.test('createWorkspaceResolver: getDependencyGraph construit le graphe', () => {
  const resolver = createWorkspaceResolver([
    { name: '@mono/ui', version: '1.0.0', dependencies: ['@mono/tokens'] },
    { name: '@mono/tokens', version: '1.0.0', dependencies: [] },
    { name: '@mono/app', version: '1.0.0', dependencies: ['@mono/ui', '@mono/utils'] },
    { name: '@mono/utils', version: '1.0.0', dependencies: [] },
  ]);
  const graph = resolver.getDependencyGraph();
  assertDeepEqual(graph['@mono/ui'], ['@mono/tokens']);
  assertDeepEqual(graph['@mono/tokens'], []);
  assertArrayContains(graph['@mono/app'], '@mono/ui');
  assertArrayContains(graph['@mono/app'], '@mono/utils');
});

runner.test('createWorkspaceResolver: findCircular detecte un cycle simple', () => {
  const resolver = createWorkspaceResolver([
    { name: 'A', version: '1.0.0', dependencies: ['B'] },
    { name: 'B', version: '1.0.0', dependencies: ['A'] },
  ]);
  const cycles = resolver.findCircular();
  assertEqual(cycles.length, 1);
  assertDeepEqual(cycles[0], ['A', 'B']);
});

runner.test('createWorkspaceResolver: findCircular retourne [] si pas de cycle', () => {
  const resolver = createWorkspaceResolver([
    { name: 'A', version: '1.0.0', dependencies: ['B'] },
    { name: 'B', version: '1.0.0', dependencies: [] },
  ]);
  const cycles = resolver.findCircular();
  assertEqual(cycles.length, 0);
});

// --- createAffectedFilter ---

runner.test('createAffectedFilter: getAffected inclut les packages modifies', () => {
  const graph: DependencyGraph = {
    '@mono/ui': ['@mono/tokens'],
    '@mono/tokens': [],
    '@mono/app': ['@mono/ui'],
  };
  const changes: ChangeInfo[] = [{ package: '@mono/tokens', files: ['src/index.ts'] }];
  const filter = createAffectedFilter(changes, graph);
  const affected = filter.getAffected();
  assertArrayContains(affected, '@mono/tokens');
});

runner.test('createAffectedFilter: getAffected inclut les dependants transitifs', () => {
  const graph: DependencyGraph = {
    '@mono/ui': ['@mono/tokens'],
    '@mono/tokens': [],
    '@mono/app': ['@mono/ui'],
  };
  const changes: ChangeInfo[] = [{ package: '@mono/tokens', files: ['src/colors.ts'] }];
  const filter = createAffectedFilter(changes, graph);
  const affected = filter.getAffected();
  assertArrayContains(affected, '@mono/tokens');
  assertArrayContains(affected, '@mono/ui');
  assertArrayContains(affected, '@mono/app');
});

runner.test('createAffectedFilter: shouldBuild retourne true pour package affecte', () => {
  const graph: DependencyGraph = {
    '@mono/ui': ['@mono/tokens'],
    '@mono/tokens': [],
  };
  const changes: ChangeInfo[] = [{ package: '@mono/tokens', files: ['src/index.ts'] }];
  const filter = createAffectedFilter(changes, graph);
  assertTrue(filter.shouldBuild('@mono/tokens'));
  assertTrue(filter.shouldBuild('@mono/ui'));
});

runner.test('createAffectedFilter: shouldBuild retourne false pour package non affecte', () => {
  const graph: DependencyGraph = {
    '@mono/ui': ['@mono/tokens'],
    '@mono/tokens': [],
    '@mono/config': [],
  };
  const changes: ChangeInfo[] = [{ package: '@mono/tokens', files: ['src/index.ts'] }];
  const filter = createAffectedFilter(changes, graph);
  assertTrue(!filter.shouldBuild('@mono/config'));
});

runner.test('createAffectedFilter: shouldTest inclut les dependants directs', () => {
  const graph: DependencyGraph = {
    '@mono/ui': ['@mono/tokens'],
    '@mono/tokens': [],
    '@mono/app': ['@mono/ui'],
  };
  const changes: ChangeInfo[] = [{ package: '@mono/ui', files: ['src/Button.tsx'] }];
  const filter = createAffectedFilter(changes, graph);
  assertTrue(filter.shouldTest('@mono/ui'));
  assertTrue(filter.shouldTest('@mono/app'));
});

// --- createDesignTokenPipeline ---

runner.test('createDesignTokenPipeline: transform css genere des variables CSS', () => {
  const pipeline = createDesignTokenPipeline([
    { name: 'primary', value: '#0066FF', category: 'color' },
    { name: 'md', value: 16, category: 'spacing' },
  ]);
  const result = pipeline.transform('css');
  assertEqual(result['--color-primary'], '#0066FF');
  assertEqual(result['--spacing-md'], 16);
});

runner.test('createDesignTokenPipeline: transform rn genere des clefs camelCase', () => {
  const pipeline = createDesignTokenPipeline([
    { name: 'primary', value: '#0066FF', category: 'color' },
    { name: 'md', value: 16, category: 'spacing' },
  ]);
  const result = pipeline.transform('rn');
  assertEqual(result['colorPrimary'], '#0066FF');
  assertEqual(result['spacingMd'], 16);
});

runner.test('createDesignTokenPipeline: generateCSS produit du CSS valide', () => {
  const pipeline = createDesignTokenPipeline([
    { name: 'primary', value: '#0066FF', category: 'color' },
  ]);
  const css = pipeline.generateCSS();
  assertContains(css, ':root {');
  assertContains(css, '--color-primary: #0066FF;');
  assertContains(css, '}');
});

runner.test('createDesignTokenPipeline: generateRN produit du TypeScript valide', () => {
  const pipeline = createDesignTokenPipeline([
    { name: 'primary', value: '#0066FF', category: 'color' },
    { name: 'md', value: 16, category: 'spacing' },
  ]);
  const rn = pipeline.generateRN();
  assertContains(rn, 'export const tokens = {');
  assertContains(rn, 'colorPrimary: "#0066FF"');
  assertContains(rn, 'spacingMd: 16');
  assertContains(rn, '} as const;');
});

runner.test('createDesignTokenPipeline: validate detecte les couleurs invalides', () => {
  const pipeline = createDesignTokenPipeline([
    { name: 'bad', value: 'not-a-color', category: 'color' },
  ]);
  const errors = pipeline.validate();
  assertEqual(errors.length, 1);
  assertContains(errors[0], 'Invalid color');
});

runner.test('createDesignTokenPipeline: validate detecte les spacings invalides', () => {
  const pipeline = createDesignTokenPipeline([
    { name: 'negative', value: -5, category: 'spacing' },
  ]);
  const errors = pipeline.validate();
  assertEqual(errors.length, 1);
  assertContains(errors[0], 'Invalid spacing');
});

runner.test('createDesignTokenPipeline: validate accepte les tokens valides', () => {
  const pipeline = createDesignTokenPipeline([
    { name: 'primary', value: '#0066FF', category: 'color' },
    { name: 'md', value: 16, category: 'spacing' },
    { name: 'lg', value: 18, category: 'fontSize' },
    { name: 'sm', value: 4, category: 'radius' },
  ]);
  const errors = pipeline.validate();
  assertEqual(errors.length, 0);
});

// --- createPackagePublisher ---

runner.test('createPackagePublisher: version patch incremente le patch', () => {
  const publisher = createPackagePublisher([
    { name: '@mono/ui', currentVersion: '1.2.3', bump: 'patch' },
  ]);
  const newVersion = publisher.version('@mono/ui', 'patch');
  assertEqual(newVersion, '1.2.4');
});

runner.test('createPackagePublisher: version minor incremente le minor', () => {
  const publisher = createPackagePublisher([
    { name: '@mono/ui', currentVersion: '1.2.3', bump: 'minor' },
  ]);
  const newVersion = publisher.version('@mono/ui', 'minor');
  assertEqual(newVersion, '1.3.0');
});

runner.test('createPackagePublisher: version major incremente le major', () => {
  const publisher = createPackagePublisher([
    { name: '@mono/ui', currentVersion: '1.2.3', bump: 'major' },
  ]);
  const newVersion = publisher.version('@mono/ui', 'major');
  assertEqual(newVersion, '2.0.0');
});

runner.test('createPackagePublisher: version lance erreur si package inconnu', () => {
  const publisher = createPackagePublisher([]);
  let threw = false;
  try {
    publisher.version('@mono/unknown', 'patch');
  } catch {
    threw = true;
  }
  assertTrue(threw);
});

runner.test('createPackagePublisher: publish retourne success si versionne', () => {
  const publisher = createPackagePublisher([
    { name: '@mono/ui', currentVersion: '1.0.0', bump: 'patch' },
  ]);
  publisher.version('@mono/ui', 'patch');
  const result = publisher.publish('@mono/ui');
  assertTrue(result.success);
  assertEqual(result.version, '1.0.1');
});

runner.test('createPackagePublisher: publish retourne !success si pas versionne', () => {
  const publisher = createPackagePublisher([
    { name: '@mono/ui', currentVersion: '1.0.0', bump: 'patch' },
  ]);
  const result = publisher.publish('@mono/ui');
  assertTrue(!result.success);
});

runner.test('createPackagePublisher: getChangelog retourne l\'historique', () => {
  const publisher = createPackagePublisher([
    { name: '@mono/ui', currentVersion: '1.0.0', bump: 'patch' },
  ]);
  publisher.version('@mono/ui', 'patch');
  publisher.version('@mono/ui', 'minor');
  const log = publisher.getChangelog('@mono/ui');
  assertEqual(log.length, 2);
  assertContains(log[0], '1.0.0 -> 1.0.1 (patch)');
  assertContains(log[1], '1.0.1 -> 1.1.0 (minor)');
});

// --- createBuildCache ---

runner.test('createBuildCache: set et get fonctionnent', () => {
  const cache = createBuildCache();
  cache.set('build:ui', 'abc123', 'dist/ui');
  const entry = cache.get('build:ui');
  assertEqual(entry?.hash, 'abc123');
  assertEqual(entry?.output, 'dist/ui');
});

runner.test('createBuildCache: get retourne undefined si absent', () => {
  const cache = createBuildCache();
  assertEqual(cache.get('missing'), undefined);
});

runner.test('createBuildCache: invalidate supprime une entree', () => {
  const cache = createBuildCache();
  cache.set('key', 'hash', 'output');
  assertTrue(cache.invalidate('key'));
  assertEqual(cache.get('key'), undefined);
});

runner.test('createBuildCache: invalidate retourne false si absent', () => {
  const cache = createBuildCache();
  assertTrue(!cache.invalidate('missing'));
});

runner.test('createBuildCache: getHitRate calcule le taux de hits', () => {
  const cache = createBuildCache();
  cache.set('a', 'h1', 'o1');
  cache.get('a');  // hit
  cache.get('b');  // miss
  cache.get('a');  // hit
  assertEqual(cache.getHitRate(), 0.67);
});

runner.test('createBuildCache: getHitRate retourne 0 si aucun lookup', () => {
  const cache = createBuildCache();
  assertEqual(cache.getHitRate(), 0);
});

runner.run();
