// ============================================================================
// LAB 24 — Fabric & JSI (logique pure)
// ============================================================================
// Objectif : comprendre les mecanismes internes de Fabric et JSI en
// implementant leurs concepts fondamentaux en TypeScript pur :
// shadow tree, host objects, diffing, concurrent queue, component spec.
// Lancez avec : npx tsx labs/lab-24-fabric-jsi/exercise.ts
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
  assertGreaterThan,
} from '../test-utils.ts';

const runner = createTestRunner('Lab 24 — Fabric & JSI (logique pure)');

// ============================================================================
// Types de base
// ============================================================================

interface ShadowNode {
  id: number;
  type: string;
  props: Record<string, unknown>;
  children: ShadowNode[];
  parent: ShadowNode | null;
}

interface ShadowTree {
  root: ShadowNode;
  appendChild(parentId: number, child: Omit<ShadowNode, 'parent' | 'children'>): ShadowNode;
  removeChild(parentId: number, childId: number): boolean;
  update(nodeId: number, props: Record<string, unknown>): boolean;
  flatten(): { id: number; type: string; depth: number }[];
  findById(id: number): ShadowNode | null;
}

interface HostObject {
  get(propName: string): unknown;
  set(propName: string, value: unknown): void;
  getPropertyNames(): string[];
  hasProperty(name: string): boolean;
}

type MutationType = 'create' | 'delete' | 'update' | 'insert' | 'remove';

interface Mutation {
  type: MutationType;
  nodeId: number;
  nodeType?: string;
  parentId?: number;
  props?: Record<string, unknown>;
  index?: number;
}

type Priority = 'urgent' | 'normal' | 'low';

interface ConcurrentTask<T = unknown> {
  id: string;
  priority: Priority;
  execute: () => T;
}

interface ConcurrentQueue {
  enqueue<T>(task: ConcurrentTask<T>): void;
  flush(): unknown[];
  getByPriority(priority: Priority): ConcurrentTask[];
  size(): number;
  clear(): void;
}

type PropType = 'string' | 'number' | 'boolean' | 'Float' | 'Int32' | 'color' | 'callback';

interface ComponentPropSpec {
  name: string;
  type: PropType;
  required: boolean;
  defaultValue?: unknown;
}

interface ComponentEventSpec {
  name: string;
  bubbling: 'direct' | 'bubbling';
  payload: Record<string, PropType>;
}

interface ComponentSpec {
  name: string;
  props: ComponentPropSpec[];
  events: ComponentEventSpec[];
  validate(props: Record<string, unknown>): { valid: boolean; errors: string[] };
  generateTypes(): string;
}

// ============================================================================
// Exercice 1 : createShadowTree
// ============================================================================
// Cree un shadow tree avec un noeud racine.
// - appendChild(parentId, child) : ajoute un enfant a un noeud, retourne le nouveau noeud
// - removeChild(parentId, childId) : supprime un enfant
// - update(nodeId, props) : met a jour les props d'un noeud (merge)
// - flatten() : retourne une liste plate avec type et profondeur (DFS)
// - findById(id) : retrouve un noeud par son id

function createShadowTree(rootNode: { id: number; type: string; props: Record<string, unknown> }): ShadowTree {
  // TODO: Implementer cette fonction
  throw new Error('Non implemente');
}

runner.test('createShadowTree — cree un arbre avec racine', () => {
  const tree = createShadowTree({ id: 1, type: 'View', props: { flex: 1 } });
  assertNotNull(tree.root);
  assertEqual(tree.root.id, 1);
  assertEqual(tree.root.type, 'View');
  assertDeepEqual(tree.root.props, { flex: 1 });
});

runner.test('createShadowTree — appendChild ajoute un enfant', () => {
  const tree = createShadowTree({ id: 1, type: 'View', props: {} });
  const child = tree.appendChild(1, { id: 2, type: 'Text', props: { text: 'Hello' } });
  assertEqual(child.id, 2);
  assertEqual(child.type, 'Text');
  assertLength(tree.root.children, 1);
  assertEqual(tree.root.children[0].id, 2);
});

runner.test('createShadowTree — removeChild supprime un enfant', () => {
  const tree = createShadowTree({ id: 1, type: 'View', props: {} });
  tree.appendChild(1, { id: 2, type: 'Text', props: {} });
  tree.appendChild(1, { id: 3, type: 'Text', props: {} });
  assertLength(tree.root.children, 2);
  const removed = tree.removeChild(1, 2);
  assertTrue(removed);
  assertLength(tree.root.children, 1);
  assertEqual(tree.root.children[0].id, 3);
});

runner.test('createShadowTree — removeChild retourne false si enfant inexistant', () => {
  const tree = createShadowTree({ id: 1, type: 'View', props: {} });
  const removed = tree.removeChild(1, 99);
  assertFalse(removed);
});

runner.test('createShadowTree — update modifie les props', () => {
  const tree = createShadowTree({ id: 1, type: 'View', props: { flex: 1, color: 'red' } });
  const updated = tree.update(1, { color: 'blue', margin: 10 });
  assertTrue(updated);
  assertDeepEqual(tree.root.props, { flex: 1, color: 'blue', margin: 10 });
});

runner.test('createShadowTree — update retourne false si noeud inexistant', () => {
  const tree = createShadowTree({ id: 1, type: 'View', props: {} });
  const updated = tree.update(99, { color: 'blue' });
  assertFalse(updated);
});

runner.test('createShadowTree — flatten retourne la liste DFS', () => {
  const tree = createShadowTree({ id: 1, type: 'View', props: {} });
  tree.appendChild(1, { id: 2, type: 'Text', props: {} });
  tree.appendChild(1, { id: 3, type: 'View', props: {} });
  tree.appendChild(3, { id: 4, type: 'Image', props: {} });
  const flat = tree.flatten();
  assertLength(flat, 4);
  assertDeepEqual(flat[0], { id: 1, type: 'View', depth: 0 });
  assertDeepEqual(flat[1], { id: 2, type: 'Text', depth: 1 });
  assertDeepEqual(flat[2], { id: 3, type: 'View', depth: 1 });
  assertDeepEqual(flat[3], { id: 4, type: 'Image', depth: 2 });
});

runner.test('createShadowTree — findById trouve un noeud profond', () => {
  const tree = createShadowTree({ id: 1, type: 'View', props: {} });
  tree.appendChild(1, { id: 2, type: 'View', props: {} });
  tree.appendChild(2, { id: 3, type: 'Text', props: { text: 'deep' } });
  const node = tree.findById(3);
  assertNotNull(node);
  assertEqual(node!.type, 'Text');
  assertDeepEqual(node!.props, { text: 'deep' });
});

// ============================================================================
// Exercice 2 : createHostObject
// ============================================================================
// Simule un JSI Host Object.
// - get(propName) : retourne la valeur d'une propriete ou le resultat d'une methode
// - set(propName, value) : modifie une propriete
// - getPropertyNames() : retourne la liste des noms de proprietes et methodes
// - hasProperty(name) : verifie l'existence d'une propriete

function createHostObject(
  properties: Record<string, unknown>,
  methods: Record<string, (...args: any[]) => unknown>,
): HostObject {
  // TODO: Implementer cette fonction
  throw new Error('Non implemente');
}

runner.test('createHostObject — get retourne une propriete', () => {
  const obj = createHostObject({ level: 0.85, name: 'battery' }, {});
  assertEqual(obj.get('level'), 0.85);
  assertEqual(obj.get('name'), 'battery');
});

runner.test('createHostObject — get retourne une methode', () => {
  const obj = createHostObject({}, { greet: () => 'hello' });
  const greet = obj.get('greet') as () => string;
  assertEqual(greet(), 'hello');
});

runner.test('createHostObject — set modifie une propriete', () => {
  const obj = createHostObject({ count: 0 }, {});
  obj.set('count', 42);
  assertEqual(obj.get('count'), 42);
});

runner.test('createHostObject — set cree une nouvelle propriete', () => {
  const obj = createHostObject({}, {});
  obj.set('newProp', 'value');
  assertEqual(obj.get('newProp'), 'value');
  assertTrue(obj.hasProperty('newProp'));
});

runner.test('createHostObject — getPropertyNames inclut props et methodes', () => {
  const obj = createHostObject(
    { level: 0.85 },
    { getDetails: () => ({}) },
  );
  const names = obj.getPropertyNames();
  assertArrayContains(names, 'level');
  assertArrayContains(names, 'getDetails');
});

runner.test('createHostObject — hasProperty', () => {
  const obj = createHostObject({ level: 0.85 }, { refresh: () => {} });
  assertTrue(obj.hasProperty('level'));
  assertTrue(obj.hasProperty('refresh'));
  assertFalse(obj.hasProperty('unknown'));
});

// ============================================================================
// Exercice 3 : diffShadowTrees
// ============================================================================
// Compare deux shadow trees et retourne la liste des mutations.
// Types de mutations :
// - 'create' : noeud present dans newTree mais pas dans oldTree
// - 'delete' : noeud present dans oldTree mais pas dans newTree
// - 'update' : noeud present dans les deux mais avec des props differentes
// Les mutations 'insert' et 'remove' ne sont pas generees par cette version simplifiee.

function diffShadowTrees(
  oldNodes: { id: number; type: string; props: Record<string, unknown> }[],
  newNodes: { id: number; type: string; props: Record<string, unknown> }[],
): Mutation[] {
  // TODO: Implementer cette fonction
  throw new Error('Non implemente');
}

runner.test('diffShadowTrees — aucune mutation si identiques', () => {
  const nodes = [
    { id: 1, type: 'View', props: { flex: 1 } },
    { id: 2, type: 'Text', props: { text: 'Hello' } },
  ];
  const mutations = diffShadowTrees(nodes, nodes);
  assertLength(mutations, 0);
});

runner.test('diffShadowTrees — detecte les creations', () => {
  const oldNodes = [{ id: 1, type: 'View', props: {} }];
  const newNodes = [
    { id: 1, type: 'View', props: {} },
    { id: 2, type: 'Text', props: { text: 'New' } },
  ];
  const mutations = diffShadowTrees(oldNodes, newNodes);
  assertLength(mutations, 1);
  assertEqual(mutations[0].type, 'create');
  assertEqual(mutations[0].nodeId, 2);
  assertEqual(mutations[0].nodeType, 'Text');
});

runner.test('diffShadowTrees — detecte les suppressions', () => {
  const oldNodes = [
    { id: 1, type: 'View', props: {} },
    { id: 2, type: 'Text', props: {} },
  ];
  const newNodes = [{ id: 1, type: 'View', props: {} }];
  const mutations = diffShadowTrees(oldNodes, newNodes);
  assertLength(mutations, 1);
  assertEqual(mutations[0].type, 'delete');
  assertEqual(mutations[0].nodeId, 2);
});

runner.test('diffShadowTrees — detecte les mises a jour', () => {
  const oldNodes = [{ id: 1, type: 'View', props: { color: 'red' } }];
  const newNodes = [{ id: 1, type: 'View', props: { color: 'blue' } }];
  const mutations = diffShadowTrees(oldNodes, newNodes);
  assertLength(mutations, 1);
  assertEqual(mutations[0].type, 'update');
  assertEqual(mutations[0].nodeId, 1);
  assertDeepEqual(mutations[0].props, { color: 'blue' });
});

runner.test('diffShadowTrees — detecte create + delete + update ensemble', () => {
  const oldNodes = [
    { id: 1, type: 'View', props: { flex: 1 } },
    { id: 2, type: 'Text', props: { text: 'Old' } },
    { id: 3, type: 'Image', props: { uri: 'a.png' } },
  ];
  const newNodes = [
    { id: 1, type: 'View', props: { flex: 2 } },   // update
    { id: 2, type: 'Text', props: { text: 'Old' } }, // inchange
    { id: 4, type: 'Button', props: { title: 'OK' } }, // create (3 supprime)
  ];
  const mutations = diffShadowTrees(oldNodes, newNodes);
  // 1 update (id:1), 1 delete (id:3), 1 create (id:4)
  assertEqual(mutations.length, 3);
  const types = mutations.map((m) => m.type);
  assertArrayContains(types, 'update');
  assertArrayContains(types, 'delete');
  assertArrayContains(types, 'create');
});

// ============================================================================
// Exercice 4 : createConcurrentQueue
// ============================================================================
// Simule la file de taches concurrentes de Fabric.
// - enqueue(task) : ajoute une tache a la file
// - flush() : execute toutes les taches par ordre de priorite (urgent > normal > low)
//   et retourne les resultats
// - getByPriority(priority) : retourne les taches d'une priorite donnee
// - size() : nombre de taches en attente
// - clear() : vide la file

function createConcurrentQueue(): ConcurrentQueue {
  // TODO: Implementer cette fonction
  throw new Error('Non implemente');
}

runner.test('createConcurrentQueue — file vide au depart', () => {
  const queue = createConcurrentQueue();
  assertEqual(queue.size(), 0);
});

runner.test('createConcurrentQueue — enqueue ajoute des taches', () => {
  const queue = createConcurrentQueue();
  queue.enqueue({ id: 'a', priority: 'normal', execute: () => 'result-a' });
  queue.enqueue({ id: 'b', priority: 'urgent', execute: () => 'result-b' });
  assertEqual(queue.size(), 2);
});

runner.test('createConcurrentQueue — flush execute par priorite', () => {
  const queue = createConcurrentQueue();
  const order: string[] = [];
  queue.enqueue({ id: 'low-1', priority: 'low', execute: () => { order.push('low'); return 'low'; } });
  queue.enqueue({ id: 'urgent-1', priority: 'urgent', execute: () => { order.push('urgent'); return 'urgent'; } });
  queue.enqueue({ id: 'normal-1', priority: 'normal', execute: () => { order.push('normal'); return 'normal'; } });
  const results = queue.flush();
  assertDeepEqual(order, ['urgent', 'normal', 'low']);
  assertDeepEqual(results, ['urgent', 'normal', 'low']);
});

runner.test('createConcurrentQueue — flush vide la file', () => {
  const queue = createConcurrentQueue();
  queue.enqueue({ id: 'a', priority: 'normal', execute: () => 1 });
  queue.flush();
  assertEqual(queue.size(), 0);
});

runner.test('createConcurrentQueue — getByPriority filtre', () => {
  const queue = createConcurrentQueue();
  queue.enqueue({ id: 'a', priority: 'urgent', execute: () => 1 });
  queue.enqueue({ id: 'b', priority: 'normal', execute: () => 2 });
  queue.enqueue({ id: 'c', priority: 'urgent', execute: () => 3 });
  const urgentTasks = queue.getByPriority('urgent');
  assertLength(urgentTasks, 2);
  assertEqual(urgentTasks[0].id, 'a');
  assertEqual(urgentTasks[1].id, 'c');
});

runner.test('createConcurrentQueue — clear vide la file', () => {
  const queue = createConcurrentQueue();
  queue.enqueue({ id: 'a', priority: 'normal', execute: () => 1 });
  queue.enqueue({ id: 'b', priority: 'low', execute: () => 2 });
  queue.clear();
  assertEqual(queue.size(), 0);
});

runner.test('createConcurrentQueue — flush preserves intra-priority order', () => {
  const queue = createConcurrentQueue();
  const order: string[] = [];
  queue.enqueue({ id: 'u1', priority: 'urgent', execute: () => { order.push('u1'); return 'u1'; } });
  queue.enqueue({ id: 'u2', priority: 'urgent', execute: () => { order.push('u2'); return 'u2'; } });
  queue.enqueue({ id: 'n1', priority: 'normal', execute: () => { order.push('n1'); return 'n1'; } });
  queue.flush();
  assertEqual(order[0], 'u1');
  assertEqual(order[1], 'u2');
  assertEqual(order[2], 'n1');
});

// ============================================================================
// Exercice 5 : createComponentSpec
// ============================================================================
// Cree un component spec pour un Fabric Component.
// - validate(props) : verifie que les props correspondent au spec
//   (props requises presentes, types corrects)
// - generateTypes() : genere une declaration TypeScript de l'interface props

function createComponentSpec(
  name: string,
  props: ComponentPropSpec[],
  events: ComponentEventSpec[],
): ComponentSpec {
  // TODO: Implementer cette fonction
  throw new Error('Non implemente');
}

runner.test('createComponentSpec — cree un spec valide', () => {
  const spec = createComponentSpec(
    'CircularProgress',
    [
      { name: 'progress', type: 'Float', required: true },
      { name: 'strokeWidth', type: 'Float', required: false, defaultValue: 8 },
    ],
    [],
  );
  assertEqual(spec.name, 'CircularProgress');
  assertLength(spec.props, 2);
});

runner.test('createComponentSpec — validate accepte des props valides', () => {
  const spec = createComponentSpec(
    'CircularProgress',
    [
      { name: 'progress', type: 'Float', required: true },
      { name: 'strokeWidth', type: 'Float', required: false, defaultValue: 8 },
    ],
    [],
  );
  const result = spec.validate({ progress: 0.7 });
  assertTrue(result.valid);
  assertLength(result.errors, 0);
});

runner.test('createComponentSpec — validate detecte prop requise manquante', () => {
  const spec = createComponentSpec(
    'CircularProgress',
    [
      { name: 'progress', type: 'Float', required: true },
      { name: 'color', type: 'string', required: true },
    ],
    [],
  );
  const result = spec.validate({ progress: 0.5 });
  assertFalse(result.valid);
  assertTrue(result.errors.length > 0);
  assertContains(result.errors[0], 'color');
});

runner.test('createComponentSpec — validate accepte props optionnelles absentes', () => {
  const spec = createComponentSpec(
    'Button',
    [
      { name: 'title', type: 'string', required: true },
      { name: 'disabled', type: 'boolean', required: false, defaultValue: false },
    ],
    [],
  );
  const result = spec.validate({ title: 'OK' });
  assertTrue(result.valid);
});

runner.test('createComponentSpec — generateTypes genere du TypeScript', () => {
  const spec = createComponentSpec(
    'CircularProgress',
    [
      { name: 'progress', type: 'Float', required: true },
      { name: 'strokeWidth', type: 'Float', required: false, defaultValue: 8 },
      { name: 'color', type: 'string', required: false },
    ],
    [
      { name: 'onComplete', bubbling: 'direct', payload: { progress: 'Float' } },
    ],
  );
  const types = spec.generateTypes();
  assertContains(types, 'interface CircularProgressProps');
  assertContains(types, 'progress: number');
  assertContains(types, 'strokeWidth?: number');
  assertContains(types, 'color?: string');
  assertContains(types, 'onComplete?');
});

runner.test('createComponentSpec — validate detecte type incorrect', () => {
  const spec = createComponentSpec(
    'Progress',
    [
      { name: 'value', type: 'number', required: true },
    ],
    [],
  );
  const result = spec.validate({ value: 'not a number' });
  assertFalse(result.valid);
  assertTrue(result.errors.length > 0);
});

// ============================================================================
// Lancer les tests
// ============================================================================

runner.run();
