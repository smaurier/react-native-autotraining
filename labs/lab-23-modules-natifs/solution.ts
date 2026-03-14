// ============================================================================
// LAB 23 — Modules natifs et Turbo Modules (logique pure) — SOLUTIONS
// ============================================================================
// Lancez avec : npx tsx labs/lab-23-modules-natifs/solution.ts
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

const runner = createTestRunner('Lab 23 — Modules natifs et Turbo Modules (Solutions)');

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

function createModuleSpec(name: string, methods: MethodSpec[]): ModuleSpec {
  if (!name || name.trim().length === 0) {
    throw new Error('Module name cannot be empty');
  }

  const methodNames = new Set<string>();
  for (const method of methods) {
    if (methodNames.has(method.name)) {
      throw new Error(`Duplicate method name: ${method.name}`);
    }
    methodNames.add(method.name);

    if (method.type === 'async' && !method.returnType.startsWith('Promise<')) {
      throw new Error(
        `Async method "${method.name}" must have a Promise return type, got "${method.returnType}"`
      );
    }
  }

  return { name, methods: [...methods] };
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

function createCodegenOutput(spec: ModuleSpec): CodegenOutput {
  const methodSignatures = spec.methods.map((method) => {
    const params = method.params.map((p) => `${p.name}: ${p.type}`).join(', ');
    return `${method.name}(${params}): ${method.returnType}`;
  });

  const hasAsyncMethods = spec.methods.some((m) => m.type === 'async');
  const hasSyncMethods = spec.methods.some((m) => m.type === 'sync');
  const paramCount = spec.methods.reduce((sum, m) => sum + m.params.length, 0);

  return {
    moduleName: spec.name,
    methodSignatures,
    hasAsyncMethods,
    hasSyncMethods,
    paramCount,
  };
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

function createNativeModuleProxy<T extends Record<string, (...args: any[]) => any>>(
  spec: ModuleSpec,
  implementation: T,
): NativeModuleProxy<T> {
  const callLog: { method: string; args: any[]; timestamp: number }[] = [];

  return {
    call<K extends keyof T>(method: K, ...args: Parameters<T[K]>): ReturnType<T[K]> {
      const methodName = String(method);

      // Verifier que la methode existe dans le spec
      const methodSpec = spec.methods.find((m) => m.name === methodName);
      if (!methodSpec) {
        throw new Error(`Method "${methodName}" not found in spec "${spec.name}"`);
      }

      // Verifier le nombre d'arguments
      if (args.length !== methodSpec.params.length) {
        throw new Error(
          `Method "${methodName}" expects ${methodSpec.params.length} arguments, got ${args.length}`
        );
      }

      // Enregistrer l'appel
      callLog.push({
        method: methodName,
        args: [...args],
        timestamp: Date.now(),
      });

      // Deleguer a l'implementation
      return implementation[methodName](...args);
    },

    getCallLog() {
      return [...callLog];
    },

    getCallCount(method: string) {
      return callLog.filter((entry) => entry.method === method).length;
    },

    resetLog() {
      callLog.length = 0;
    },
  };
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

function createAsyncToSync<T>(asyncFn: () => Promise<T>, ttlMs: number): AsyncToSyncAdapter<T> {
  let cachedValue: T | undefined = undefined;
  let lastRefreshTime = 0;

  return {
    getCached(): T | undefined {
      return cachedValue;
    },

    async refresh(): Promise<T> {
      cachedValue = await asyncFn();
      lastRefreshTime = Date.now();
      return cachedValue;
    },

    isStale(): boolean {
      if (lastRefreshTime === 0) return true;
      return Date.now() - lastRefreshTime > ttlMs;
    },
  };
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

function createModuleRegistry(): ModuleRegistry {
  const modules = new Map<string, {
    spec: ModuleSpec;
    implementation: Record<string, (...args: any[]) => any>;
  }>();

  return {
    register(spec: ModuleSpec, implementation: Record<string, (...args: any[]) => any>) {
      modules.set(spec.name, { spec, implementation });
    },

    get(name: string) {
      return modules.get(name)?.implementation;
    },

    has(name: string) {
      return modules.has(name);
    },

    list() {
      return Array.from(modules.keys());
    },

    validateAll() {
      const results: { moduleName: string; valid: boolean; errors: string[] }[] = [];

      for (const [name, { spec, implementation }] of modules) {
        const errors: string[] = [];

        for (const method of spec.methods) {
          if (typeof implementation[method.name] !== 'function') {
            errors.push(`Missing implementation for method "${method.name}"`);
          }
        }

        results.push({
          moduleName: name,
          valid: errors.length === 0,
          errors,
        });
      }

      return results;
    },

    unregister(name: string) {
      return modules.delete(name);
    },

    getSpec(name: string) {
      return modules.get(name)?.spec;
    },
  };
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
