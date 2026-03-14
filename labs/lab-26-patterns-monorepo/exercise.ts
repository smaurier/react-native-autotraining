// =============================================================================
// Lab 26 — Patterns avances et Monorepo (Exercices)
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
  dependencies: string[]; // noms des packages internes dont il depend
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
  validate(): string[]; // retourne les erreurs de validation
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
// Resout les packages dans un workspace monorepo.
// - resolve(name) : retourne le PackageInfo du package, ou undefined
// - getDependencyGraph() : retourne un objet ou chaque cle est un nom
//   de package et la valeur est la liste de ses dependances internes.
//   Inclure tous les packages, meme ceux sans dependances (liste vide).
// - findCircular() : detecte les dependances circulaires.
//   Retourne un tableau de cycles (chaque cycle est un tableau de noms).
//   Ex: si A depend de B et B depend de A → [['A', 'B']]
//   Les noms dans chaque cycle doivent etre tries alphabetiquement.
//   Les cycles eux-memes doivent etre tries par leur premier element.
//   Ne pas inclure de doublons (si [A,B] est trouve, ne pas inclure [B,A]).
// =============================================================================

function createWorkspaceResolver(_packages: PackageInfo[]): WorkspaceResolver {
  // TODO: implementez le workspace resolver
  throw new Error('Not implemented');
}

// =============================================================================
// Exercice 2 : createAffectedFilter
// Determine quels packages sont affectes par des changements.
// - changes : liste des packages modifies (avec fichiers)
// - graph : graphe de dependances (getDependencyGraph() du resolver)
//
// Un package est "affecte" si :
//   1. Il a ete modifie directement (present dans changes)
//   2. OU il depend (directement ou transitivement) d'un package modifie
//
// - getAffected() : retourne la liste des packages affectes, triee alpha.
// - shouldBuild(pkg) : retourne true si le package est affecte.
// - shouldTest(pkg) : retourne true si le package est affecte
//   OU si un de ses dependants directs est affecte.
//   (on teste aussi les packages qui dependent de nous)
// =============================================================================

function createAffectedFilter(_changes: ChangeInfo[], _graph: DependencyGraph): AffectedFilter {
  // TODO: implementez le filtre affected
  throw new Error('Not implemented');
}

// =============================================================================
// Exercice 3 : createDesignTokenPipeline
// Transforme des design tokens en differents formats.
// - transform(platform) :
//   - 'css' : retourne un objet { '--color-primary': '#0066FF', ... }
//     Les noms sont en kebab-case avec prefixe de categorie.
//   - 'rn' : retourne un objet { colorPrimary: '#0066FF', ... }
//     Les noms sont en camelCase avec prefixe de categorie.
//
// - generateCSS() : genere du CSS :root avec toutes les variables.
//   Format : ":root {\n  --{category}-{name}: {value};\n}\n"
//   Trier les variables par categorie puis par nom.
//
// - generateRN() : genere un export TypeScript :
//   "export const tokens = {\n  {camelKey}: {value},\n} as const;\n"
//   Les valeurs string sont entourees de guillemets, les nombres non.
//   Trier par categorie puis par nom.
//
// - validate() : retourne les erreurs de validation :
//   - Les couleurs (category 'color') doivent commencer par '#'
//     Erreur : "Invalid color: {name} ({value})"
//   - Les spacings doivent etre des nombres > 0
//     Erreur : "Invalid spacing: {name} ({value})"
//   - Les fontSizes doivent etre des nombres > 0
//     Erreur : "Invalid fontSize: {name} ({value})"
//   - Les radius doivent etre des nombres >= 0
//     Erreur : "Invalid radius: {name} ({value})"
// =============================================================================

function createDesignTokenPipeline(_tokens: DesignToken[]): DesignTokenPipeline {
  // TODO: implementez le pipeline de tokens
  throw new Error('Not implemented');
}

// =============================================================================
// Exercice 4 : createPackagePublisher
// Gere le versioning et la publication des packages.
// - Le constructeur recoit un tableau de PackageVersion avec les
//   versions courantes.
//
// - version(pkg, bump) : applique le bump et retourne la nouvelle version.
//   Utiliser le semver : patch = x.y.Z+1, minor = x.Y+1.0, major = X+1.0.0
//   Lance une erreur si le package n'existe pas.
//   Enregistre le changement dans un changelog interne.
//
// - publish(pkg) : "publie" le package. Retourne { name, version, success }.
//   success = true si le package a ete versionne au moins une fois.
//   success = false si le package n'a jamais ete versionne (pas de bump).
//   Lance une erreur si le package n'existe pas.
//
// - getChangelog(pkg) : retourne les entrees du changelog pour ce package.
//   Chaque entree : "{oldVersion} -> {newVersion} ({bump})"
//   Lance une erreur si le package n'existe pas.
// =============================================================================

function createPackagePublisher(_packages: PackageVersion[]): PackagePublisher {
  // TODO: implementez le publisher
  throw new Error('Not implemented');
}

// =============================================================================
// Exercice 5 : createBuildCache
// Gere un cache de build pour eviter les rebuilds inutiles.
// - get(key) : retourne l'entree du cache, ou undefined si absente.
//   Chaque appel a get() compte comme un "lookup" (hit si trouve, miss sinon).
//
// - set(key, hash, output) : ajoute ou met a jour une entree du cache.
//   Le timestamp est Date.now().
//
// - invalidate(key) : supprime une entree du cache.
//   Retourne true si l'entree existait, false sinon.
//
// - getHitRate() : retourne le taux de cache hit (hits / total lookups).
//   Retourne 0 si aucun lookup n'a ete fait.
//   Arrondi a 2 decimales.
// =============================================================================

function createBuildCache(): BuildCache {
  // TODO: implementez le build cache
  throw new Error('Not implemented');
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
  // 2 hits / 3 lookups = 0.67
  assertEqual(cache.getHitRate(), 0.67);
});

runner.test('createBuildCache: getHitRate retourne 0 si aucun lookup', () => {
  const cache = createBuildCache();
  assertEqual(cache.getHitRate(), 0);
});

runner.run();
