// ============================================================================
// LAB 23 — Modules natifs et Turbo Modules (logique pure)
// ============================================================================
// Objectif : comprendre les mecanismes internes des Turbo Modules en
// implementant leurs concepts fondamentaux en TypeScript pur :
// specs, codegen, proxies, validation, registry.
// Lancez avec : npx tsx labs/lab-23-modules-natifs/exercise.ts
// ============================================================================

import {
  createTestRunner,
  assertEqual,
  assertDeepEqual,
  assertTrue,
  assertFalse,
  assertThrows,
  assertContains,
  assertArrayContains,
  assertLength,
  assertNotNull,
} from '../test-utils.ts';

const runner = createTestRunner('Lab 23 — Modules natifs et Turbo Modules (logique pure)');

// ============================================================================
// Types de base
// ============================================================================

type MethodType = 'sync' | 'async';
type ParamType = 'string' | 'number' | 'boolean' | 'object' | 'array';
type ReturnType = 'void' | 'string' | 'number' | 'boolean' | 'object' | 'array' | 'Promise<string>' | 'Promise<number>' | 'Promise<object>';

interface MethodSpec {
  name: string;
  type: MethodType;
  params: { name: string; type: ParamType }[];
  returnType: ReturnType;
}

interface ModuleSpec {
  name: string;
  methods: MethodSpec[];
}

interface CodegenOutput {
  moduleName: string;
  methodSignatures: string[];
  hasAsyncMethods: boolean;
  hasSyncMethods: boolean;
  paramCount: number;
}

interface NativeModuleProxy<T extends Record<string, (...args: any[]) => any>> {
  call<K extends keyof T>(method: K, ...args: Parameters<T[K]>): ReturnType<T[K]>;
  getCallLog(): { method: string; args: any[]; timestamp: number }[];
  getCallCount(method: string): number;
  resetLog(): void;
}

interface AsyncToSyncAdapter<T> {
  getCached(): T | undefined;
  refresh(): Promise<T>;
  isStale(): boolean;
}

interface ModuleRegistry {
  register(spec: ModuleSpec, implementation: Record<string, (...args: any[]) => any>): void;
  get(name: string): Record<string, (...args: any[]) => any> | undefined;
  has(name: string): boolean;
  list(): string[];
  validateAll(): { moduleName: string; valid: boolean; errors: string[] }[];
  unregister(name: string): boolean;
  getSpec(name: string): ModuleSpec | undefined;
}

// ============================================================================
// Exercice 1 : createModuleSpec
// ============================================================================
// Cree une spec de module natif a partir d'un nom et d'une liste de methodes.
// - Valide que le nom du module n'est pas vide
// - Valide que chaque methode a un nom unique
// - Valide que les types de retour async utilisent Promise<...>
// - Leve une erreur si les validations echouent

function createModuleSpec(name: string, methods: MethodSpec[]): ModuleSpec {
  // TODO: Implementer cette fonction
  throw new Error('Non implemente');
}

runner.test('createModuleSpec — cree un spec valide', () => {
  const spec = createModuleSpec('BatteryModule', [
    { name: 'getLevel', type: 'sync', params: [], returnType: 'number' },
    { name: 'getState', type: 'async', params: [], returnType: 'Promise<string>' },
  ]);
  assertEqual(spec.name, 'BatteryModule');
  assertLength(spec.methods, 2);
  assertEqual(spec.methods[0].name, 'getLevel');
  assertEqual(spec.methods[1].name, 'getState');
});

runner.test('createModuleSpec — erreur si nom vide', () => {
  assertThrows(() => {
    createModuleSpec('', []);
  });
});

runner.test('createModuleSpec — erreur si methodes dupliquees', () => {
  assertThrows(() => {
    createModuleSpec('TestModule', [
      { name: 'doThing', type: 'sync', params: [], returnType: 'void' },
      { name: 'doThing', type: 'async', params: [], returnType: 'Promise<string>' },
    ]);
  });
});

runner.test('createModuleSpec — erreur si async sans Promise', () => {
  assertThrows(() => {
    createModuleSpec('TestModule', [
      { name: 'fetchData', type: 'async', params: [], returnType: 'string' },
    ]);
  });
});

// ============================================================================
// Exercice 2 : createCodegenOutput
// ============================================================================
// Simule la sortie du codegen React Native.
// A partir d'un ModuleSpec, genere :
// - Les signatures de methodes (format: "methodName(param1: type, param2: type): returnType")
// - Un flag hasAsyncMethods / hasSyncMethods
// - Le nombre total de parametres

function createCodegenOutput(spec: ModuleSpec): CodegenOutput {
  // TODO: Implementer cette fonction
  throw new Error('Non implemente');
}

runner.test('createCodegenOutput — genere les signatures', () => {
  const spec = createModuleSpec('Battery', [
    { name: 'getLevel', type: 'sync', params: [], returnType: 'number' },
    {
      name: 'setState',
      type: 'sync',
      params: [{ name: 'threshold', type: 'number' }],
      returnType: 'void',
    },
  ]);
  const output = createCodegenOutput(spec);
  assertEqual(output.moduleName, 'Battery');
  assertLength(output.methodSignatures, 2);
  assertEqual(output.methodSignatures[0], 'getLevel(): number');
  assertEqual(output.methodSignatures[1], 'setState(threshold: number): void');
});

runner.test('createCodegenOutput — detecte async et sync', () => {
  const spec = createModuleSpec('Mixed', [
    { name: 'syncMethod', type: 'sync', params: [], returnType: 'number' },
    { name: 'asyncMethod', type: 'async', params: [], returnType: 'Promise<string>' },
  ]);
  const output = createCodegenOutput(spec);
  assertTrue(output.hasAsyncMethods);
  assertTrue(output.hasSyncMethods);
});

runner.test('createCodegenOutput — compte les parametres', () => {
  const spec = createModuleSpec('DeviceInfo', [
    {
      name: 'setConfig',
      type: 'sync',
      params: [
        { name: 'key', type: 'string' },
        { name: 'value', type: 'string' },
      ],
      returnType: 'void',
    },
    {
      name: 'getInfo',
      type: 'sync',
      params: [{ name: 'category', type: 'string' }],
      returnType: 'object',
    },
  ]);
  const output = createCodegenOutput(spec);
  assertEqual(output.paramCount, 3);
});

runner.test('createCodegenOutput — signature avec plusieurs params', () => {
  const spec = createModuleSpec('Image', [
    {
      name: 'resize',
      type: 'async',
      params: [
        { name: 'uri', type: 'string' },
        { name: 'width', type: 'number' },
        { name: 'height', type: 'number' },
      ],
      returnType: 'Promise<object>',
    },
  ]);
  const output = createCodegenOutput(spec);
  assertEqual(
    output.methodSignatures[0],
    'resize(uri: string, width: number, height: number): Promise<object>'
  );
});

// ============================================================================
// Exercice 3 : createNativeModuleProxy
// ============================================================================
// Cree un proxy qui valide les appels de methodes par rapport au spec.
// - Verifie que la methode appelee existe dans le spec
// - Verifie le nombre d'arguments
// - Enregistre chaque appel dans un log (methode, args, timestamp)
// - Delegue l'appel a l'implementation reelle

function createNativeModuleProxy<T extends Record<string, (...args: any[]) => any>>(
  spec: ModuleSpec,
  implementation: T,
): NativeModuleProxy<T> {
  // TODO: Implementer cette fonction
  throw new Error('Non implemente');
}

runner.test('createNativeModuleProxy — appel valide retourne le resultat', () => {
  const spec = createModuleSpec('Math', [
    {
      name: 'add',
      type: 'sync',
      params: [
        { name: 'a', type: 'number' },
        { name: 'b', type: 'number' },
      ],
      returnType: 'number',
    },
  ]);
  const impl = { add: (a: number, b: number) => a + b };
  const proxy = createNativeModuleProxy(spec, impl);
  const result = proxy.call('add', 3, 4);
  assertEqual(result, 7);
});

runner.test('createNativeModuleProxy — erreur si methode inexistante', () => {
  const spec = createModuleSpec('Math', [
    { name: 'add', type: 'sync', params: [{ name: 'a', type: 'number' }, { name: 'b', type: 'number' }], returnType: 'number' },
  ]);
  const impl = { add: (a: number, b: number) => a + b };
  const proxy = createNativeModuleProxy(spec, impl);
  assertThrows(() => {
    (proxy as any).call('subtract', 3, 4);
  });
});

runner.test('createNativeModuleProxy — erreur si mauvais nombre d\'args', () => {
  const spec = createModuleSpec('Math', [
    {
      name: 'add',
      type: 'sync',
      params: [
        { name: 'a', type: 'number' },
        { name: 'b', type: 'number' },
      ],
      returnType: 'number',
    },
  ]);
  const impl = { add: (a: number, b: number) => a + b };
  const proxy = createNativeModuleProxy(spec, impl);
  assertThrows(() => {
    (proxy as any).call('add', 3);
  });
});

runner.test('createNativeModuleProxy — enregistre les appels dans le log', () => {
  const spec = createModuleSpec('Battery', [
    { name: 'getLevel', type: 'sync', params: [], returnType: 'number' },
  ]);
  const impl = { getLevel: () => 85 };
  const proxy = createNativeModuleProxy(spec, impl);
  proxy.call('getLevel');
  proxy.call('getLevel');
  const log = proxy.getCallLog();
  assertLength(log, 2);
  assertEqual(log[0].method, 'getLevel');
  assertEqual(proxy.getCallCount('getLevel'), 2);
});

runner.test('createNativeModuleProxy — resetLog vide le journal', () => {
  const spec = createModuleSpec('Battery', [
    { name: 'getLevel', type: 'sync', params: [], returnType: 'number' },
  ]);
  const impl = { getLevel: () => 85 };
  const proxy = createNativeModuleProxy(spec, impl);
  proxy.call('getLevel');
  assertEqual(proxy.getCallCount('getLevel'), 1);
  proxy.resetLog();
  assertEqual(proxy.getCallCount('getLevel'), 0);
  assertLength(proxy.getCallLog(), 0);
});

// ============================================================================
// Exercice 4 : createAsyncToSync
// ============================================================================
// Simule le pattern adapter async → sync utilise par JSI.
// - Prend une fonction async et un TTL (time-to-live en ms)
// - getCached() retourne la derniere valeur mise en cache (undefined si aucune)
// - refresh() appelle la fonction async et met a jour le cache
// - isStale() retourne true si le cache est plus vieux que le TTL

function createAsyncToSync<T>(asyncFn: () => Promise<T>, ttlMs: number): AsyncToSyncAdapter<T> {
  // TODO: Implementer cette fonction
  throw new Error('Non implemente');
}

runner.test('createAsyncToSync — cache initialement vide', () => {
  const adapter = createAsyncToSync(async () => 42, 1000);
  assertEqual(adapter.getCached(), undefined);
});

runner.test('createAsyncToSync — refresh remplit le cache', async () => {
  const adapter = createAsyncToSync(async () => 'hello', 1000);
  await adapter.refresh();
  assertEqual(adapter.getCached(), 'hello');
});

runner.test('createAsyncToSync — isStale avant refresh', () => {
  const adapter = createAsyncToSync(async () => 42, 1000);
  assertTrue(adapter.isStale());
});

runner.test('createAsyncToSync — isStale false apres refresh', async () => {
  const adapter = createAsyncToSync(async () => 42, 5000);
  await adapter.refresh();
  assertFalse(adapter.isStale());
});

// ============================================================================
// Exercice 5 : createModuleRegistry
// ============================================================================
// Cree un registre de modules natifs similaire a TurboModuleRegistry.
// - register(spec, implementation) : enregistre un module
// - get(name) : retourne l'implementation ou undefined
// - has(name) : verifie si un module est enregistre
// - list() : retourne la liste des noms de modules
// - validateAll() : verifie que chaque implementation couvre toutes les methodes du spec
// - unregister(name) : supprime un module
// - getSpec(name) : retourne le spec d'un module

function createModuleRegistry(): ModuleRegistry {
  // TODO: Implementer cette fonction
  throw new Error('Non implemente');
}

runner.test('createModuleRegistry — register et get', () => {
  const registry = createModuleRegistry();
  const spec = createModuleSpec('Battery', [
    { name: 'getLevel', type: 'sync', params: [], returnType: 'number' },
  ]);
  const impl = { getLevel: () => 85 };
  registry.register(spec, impl);
  const mod = registry.get('Battery');
  assertNotNull(mod);
  assertEqual(mod!.getLevel(), 85);
});

runner.test('createModuleRegistry — has retourne true/false', () => {
  const registry = createModuleRegistry();
  const spec = createModuleSpec('Battery', [
    { name: 'getLevel', type: 'sync', params: [], returnType: 'number' },
  ]);
  registry.register(spec, { getLevel: () => 85 });
  assertTrue(registry.has('Battery'));
  assertFalse(registry.has('Camera'));
});

runner.test('createModuleRegistry — list retourne les noms', () => {
  const registry = createModuleRegistry();
  registry.register(
    createModuleSpec('Battery', [{ name: 'getLevel', type: 'sync', params: [], returnType: 'number' }]),
    { getLevel: () => 85 },
  );
  registry.register(
    createModuleSpec('DeviceInfo', [{ name: 'getModel', type: 'sync', params: [], returnType: 'string' }]),
    { getModel: () => 'iPhone 16' },
  );
  const names = registry.list();
  assertLength(names, 2);
  assertArrayContains(names, 'Battery');
  assertArrayContains(names, 'DeviceInfo');
});

runner.test('createModuleRegistry — validateAll detecte methodes manquantes', () => {
  const registry = createModuleRegistry();
  const spec = createModuleSpec('Battery', [
    { name: 'getLevel', type: 'sync', params: [], returnType: 'number' },
    { name: 'getState', type: 'async', params: [], returnType: 'Promise<string>' },
  ]);
  // Implementation incomplete — manque getState
  registry.register(spec, { getLevel: () => 85 } as any);
  const results = registry.validateAll();
  assertLength(results, 1);
  assertFalse(results[0].valid);
  assertTrue(results[0].errors.length > 0);
  assertContains(results[0].errors[0], 'getState');
});

runner.test('createModuleRegistry — validateAll valide un module correct', () => {
  const registry = createModuleRegistry();
  const spec = createModuleSpec('Battery', [
    { name: 'getLevel', type: 'sync', params: [], returnType: 'number' },
  ]);
  registry.register(spec, { getLevel: () => 85 });
  const results = registry.validateAll();
  assertLength(results, 1);
  assertTrue(results[0].valid);
  assertLength(results[0].errors, 0);
});

runner.test('createModuleRegistry — unregister supprime un module', () => {
  const registry = createModuleRegistry();
  registry.register(
    createModuleSpec('Battery', [{ name: 'getLevel', type: 'sync', params: [], returnType: 'number' }]),
    { getLevel: () => 85 },
  );
  assertTrue(registry.has('Battery'));
  const removed = registry.unregister('Battery');
  assertTrue(removed);
  assertFalse(registry.has('Battery'));
});

runner.test('createModuleRegistry — unregister retourne false si inexistant', () => {
  const registry = createModuleRegistry();
  const removed = registry.unregister('Unknown');
  assertFalse(removed);
});

runner.test('createModuleRegistry — getSpec retourne le spec', () => {
  const registry = createModuleRegistry();
  const spec = createModuleSpec('Battery', [
    { name: 'getLevel', type: 'sync', params: [], returnType: 'number' },
  ]);
  registry.register(spec, { getLevel: () => 85 });
  const retrieved = registry.getSpec('Battery');
  assertNotNull(retrieved);
  assertEqual(retrieved!.name, 'Battery');
  assertLength(retrieved!.methods, 1);
});

// ============================================================================
// Lancer les tests
// ============================================================================

runner.run();
