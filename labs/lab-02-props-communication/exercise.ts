// ─── Lab 02 — Props et communication ────────────────────────────────────────
// Objectifs : valider des props, fusionner des defaults, creer un event emitter,
// creer un proxy de props avec defaults, et des type guards pour discriminated unions.
//
// Lancer : npx tsx labs/lab-02-props-communication/exercise.ts
// ─────────────────────────────────────────────────────────────────────────────

import {
  createTestRunner,
  assertEqual,
  assertDeepEqual,
  assertTrue,
  assertFalse,
  assertThrows,
} from '../test-utils.ts';

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

/** Schema de validation pour les props */
export interface PropSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'function' | 'object' | 'array';
    required?: boolean;
    defaultValue?: unknown;
    validator?: (value: unknown) => boolean;
  };
}

/** Resultat de validation */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/** Event emitter generique */
export interface EventEmitter<Events extends Record<string, unknown>> {
  on<K extends keyof Events>(event: K, listener: (payload: Events[K]) => void): void;
  off<K extends keyof Events>(event: K, listener: (payload: Events[K]) => void): void;
  emit<K extends keyof Events>(event: K, payload: Events[K]): void;
  listenerCount<K extends keyof Events>(event: K): number;
}

/** Types pour les discriminated unions */
export type AlertType = 'success' | 'error' | 'warning' | 'info';

export type AlertProps =
  | { type: 'success'; message: string; autoClose?: number }
  | { type: 'error'; message: string; retryAction: () => void }
  | { type: 'warning'; message: string; level: 1 | 2 | 3 }
  | { type: 'info'; message: string; dismissible?: boolean };

export type ButtonProps =
  | { variant: 'primary'; label: string; onPress: () => void }
  | { variant: 'outline'; label: string; onPress: () => void; borderColor: string }
  | { variant: 'icon'; icon: string; onPress: () => void; accessibilityLabel: string };

// ═══════════════════════════════════════════════════════════════════════════════
// Exercice 1 : validateProps
// ═══════════════════════════════════════════════════════════════════════════════
// Valide un objet de props contre un schema.
// - Verifier que les props requises sont presentes
// - Verifier que les types correspondent
// - Executer le validator personnalise s'il existe
// - Retourner { valid: true/false, errors: string[] }

export function validateProps(schema: PropSchema, props: Record<string, unknown>): ValidationResult {
  // TODO: implementer
  throw new Error('Not implemented');
}

// ═══════════════════════════════════════════════════════════════════════════════
// Exercice 2 : mergeDefaultProps
// ═══════════════════════════════════════════════════════════════════════════════
// Fusionne les props fournies avec les valeurs par defaut du schema.
// - Les props fournies ont priorite sur les defaults
// - Les props non presentes dans le schema sont conservees telles quelles
// - Seuls les defaults du schema sont appliques pour les props manquantes

export function mergeDefaultProps(
  schema: PropSchema,
  props: Record<string, unknown>,
): Record<string, unknown> {
  // TODO: implementer
  throw new Error('Not implemented');
}

// ═══════════════════════════════════════════════════════════════════════════════
// Exercice 3 : createEventEmitter
// ═══════════════════════════════════════════════════════════════════════════════
// Cree un event emitter generique avec on/off/emit/listenerCount.
// - on : enregistre un listener pour un evenement
// - off : supprime un listener
// - emit : appelle tous les listeners d'un evenement avec le payload
// - listenerCount : retourne le nombre de listeners pour un evenement

export function createEventEmitter<
  Events extends Record<string, unknown>,
>(): EventEmitter<Events> {
  // TODO: implementer
  throw new Error('Not implemented');
}

// ═══════════════════════════════════════════════════════════════════════════════
// Exercice 4 : createPropsProxy
// ═══════════════════════════════════════════════════════════════════════════════
// Cree un proxy qui retourne la valeur de la prop si elle existe,
// sinon retourne la valeur par defaut.
// Utilise un Proxy JavaScript ou une implementation manuelle.
// Le proxy doit aussi supporter :
// - getKeys() : retourne toutes les cles (props + defaults sans doublons)
// - toObject() : retourne un objet plat avec les valeurs resolues

export interface PropsProxy<T extends Record<string, unknown>> {
  get<K extends keyof T>(key: K): T[K];
  getKeys(): (keyof T)[];
  toObject(): T;
}

export function createPropsProxy<T extends Record<string, unknown>>(
  props: Partial<T>,
  defaults: T,
): PropsProxy<T> {
  // TODO: implementer
  throw new Error('Not implemented');
}

// ═══════════════════════════════════════════════════════════════════════════════
// Exercice 5 : Type guards pour discriminated unions
// ═══════════════════════════════════════════════════════════════════════════════

export function isErrorAlert(alert: AlertProps): alert is Extract<AlertProps, { type: 'error' }> {
  // TODO: implementer
  throw new Error('Not implemented');
}

export function isSuccessAlert(alert: AlertProps): alert is Extract<AlertProps, { type: 'success' }> {
  // TODO: implementer
  throw new Error('Not implemented');
}

export function isWarningAlert(alert: AlertProps): alert is Extract<AlertProps, { type: 'warning' }> {
  // TODO: implementer
  throw new Error('Not implemented');
}

export function isIconButton(button: ButtonProps): button is Extract<ButtonProps, { variant: 'icon' }> {
  // TODO: implementer
  throw new Error('Not implemented');
}

export function getAlertDescription(alert: AlertProps): string {
  // Retourne une description selon le type :
  // - success: "Succes : {message}"
  // - error: "Erreur : {message} (retry disponible)"
  // - warning: "Attention (niveau {level}) : {message}"
  // - info: "Info : {message}"
  // TODO: implementer
  throw new Error('Not implemented');
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════════

const runner = createTestRunner('Lab 02 — Props et communication');

// ─── validateProps ──────────────────────────────────────────────────────────

runner.test('validateProps: props valides retournent valid=true', () => {
  const schema: PropSchema = {
    title: { type: 'string', required: true },
    count: { type: 'number', required: true },
    visible: { type: 'boolean' },
  };
  const result = validateProps(schema, { title: 'Hello', count: 5, visible: true });
  assertTrue(result.valid);
  assertEqual(result.errors.length, 0);
});

runner.test('validateProps: prop requise manquante', () => {
  const schema: PropSchema = {
    title: { type: 'string', required: true },
    subtitle: { type: 'string', required: true },
  };
  const result = validateProps(schema, { title: 'Hello' });
  assertFalse(result.valid);
  assertTrue(result.errors.length > 0);
  assertTrue(result.errors.some(e => e.includes('subtitle')));
});

runner.test('validateProps: type incorrect', () => {
  const schema: PropSchema = {
    count: { type: 'number', required: true },
  };
  const result = validateProps(schema, { count: 'not a number' });
  assertFalse(result.valid);
  assertTrue(result.errors.some(e => e.includes('count')));
});

runner.test('validateProps: validator personnalise echoue', () => {
  const schema: PropSchema = {
    age: {
      type: 'number',
      required: true,
      validator: (v) => typeof v === 'number' && v >= 0 && v <= 150,
    },
  };
  const result = validateProps(schema, { age: 200 });
  assertFalse(result.valid);
  assertTrue(result.errors.some(e => e.includes('age')));
});

runner.test('validateProps: type array fonctionne', () => {
  const schema: PropSchema = {
    items: { type: 'array', required: true },
  };
  const validResult = validateProps(schema, { items: [1, 2, 3] });
  assertTrue(validResult.valid);
  const invalidResult = validateProps(schema, { items: 'not array' });
  assertFalse(invalidResult.valid);
});

// ─── mergeDefaultProps ──────────────────────────────────────────────────────

runner.test('mergeDefaultProps: applique les defaults manquants', () => {
  const schema: PropSchema = {
    size: { type: 'string', defaultValue: 'md' },
    variant: { type: 'string', defaultValue: 'primary' },
    count: { type: 'number', defaultValue: 0 },
  };
  const result = mergeDefaultProps(schema, { variant: 'secondary' });
  assertEqual(result.size, 'md');
  assertEqual(result.variant, 'secondary');
  assertEqual(result.count, 0);
});

runner.test('mergeDefaultProps: conserve les props extra', () => {
  const schema: PropSchema = {
    size: { type: 'string', defaultValue: 'md' },
  };
  const result = mergeDefaultProps(schema, { size: 'lg', customProp: 42 });
  assertEqual(result.size, 'lg');
  assertEqual(result.customProp, 42);
});

// ─── createEventEmitter ─────────────────────────────────────────────────────

runner.test('EventEmitter: on + emit fonctionne', () => {
  type Events = { click: { x: number; y: number } };
  const emitter = createEventEmitter<Events>();
  let received: { x: number; y: number } | null = null;
  emitter.on('click', (payload) => { received = payload; });
  emitter.emit('click', { x: 10, y: 20 });
  assertDeepEqual(received, { x: 10, y: 20 });
});

runner.test('EventEmitter: plusieurs listeners', () => {
  type Events = { change: string };
  const emitter = createEventEmitter<Events>();
  const calls: string[] = [];
  emitter.on('change', (v) => calls.push(`a:${v}`));
  emitter.on('change', (v) => calls.push(`b:${v}`));
  emitter.emit('change', 'hello');
  assertDeepEqual(calls, ['a:hello', 'b:hello']);
});

runner.test('EventEmitter: off supprime le listener', () => {
  type Events = { ping: number };
  const emitter = createEventEmitter<Events>();
  const calls: number[] = [];
  const listener = (n: number) => calls.push(n);
  emitter.on('ping', listener);
  emitter.emit('ping', 1);
  emitter.off('ping', listener);
  emitter.emit('ping', 2);
  assertDeepEqual(calls, [1]);
});

runner.test('EventEmitter: listenerCount', () => {
  type Events = { a: void; b: void };
  const emitter = createEventEmitter<Events>();
  assertEqual(emitter.listenerCount('a'), 0);
  const fn1 = () => {};
  const fn2 = () => {};
  emitter.on('a', fn1);
  emitter.on('a', fn2);
  assertEqual(emitter.listenerCount('a'), 2);
  emitter.off('a', fn1);
  assertEqual(emitter.listenerCount('a'), 1);
});

// ─── createPropsProxy ───────────────────────────────────────────────────────

runner.test('PropsProxy: retourne la prop si elle existe', () => {
  const proxy = createPropsProxy(
    { color: 'red', size: 10 },
    { color: 'blue', size: 5, visible: true },
  );
  assertEqual(proxy.get('color'), 'red');
  assertEqual(proxy.get('size'), 10);
});

runner.test('PropsProxy: retourne le default si prop manquante', () => {
  const proxy = createPropsProxy(
    { color: 'red' },
    { color: 'blue', size: 5, visible: true },
  );
  assertEqual(proxy.get('size'), 5);
  assertEqual(proxy.get('visible'), true);
});

runner.test('PropsProxy: toObject retourne l\'objet fusionne', () => {
  const proxy = createPropsProxy(
    { color: 'red' },
    { color: 'blue', size: 5 },
  );
  assertDeepEqual(proxy.toObject(), { color: 'red', size: 5 });
});

runner.test('PropsProxy: getKeys retourne toutes les cles sans doublons', () => {
  const proxy = createPropsProxy(
    { a: 1, b: 2 },
    { a: 0, b: 0, c: 3 },
  );
  const keys = proxy.getKeys().sort();
  assertDeepEqual(keys, ['a', 'b', 'c']);
});

// ─── Discriminated union type guards ────────────────────────────────────────

runner.test('isErrorAlert: identifie correctement les alertes erreur', () => {
  const errorAlert: AlertProps = { type: 'error', message: 'Oops', retryAction: () => {} };
  const successAlert: AlertProps = { type: 'success', message: 'OK' };
  assertTrue(isErrorAlert(errorAlert));
  assertFalse(isErrorAlert(successAlert));
});

runner.test('isSuccessAlert: identifie correctement les alertes succes', () => {
  const successAlert: AlertProps = { type: 'success', message: 'Done', autoClose: 3000 };
  const warningAlert: AlertProps = { type: 'warning', message: 'Attention', level: 2 };
  assertTrue(isSuccessAlert(successAlert));
  assertFalse(isSuccessAlert(warningAlert));
});

runner.test('isIconButton: identifie les boutons icon', () => {
  const iconBtn: ButtonProps = { variant: 'icon', icon: 'star', onPress: () => {}, accessibilityLabel: 'Favori' };
  const primaryBtn: ButtonProps = { variant: 'primary', label: 'OK', onPress: () => {} };
  assertTrue(isIconButton(iconBtn));
  assertFalse(isIconButton(primaryBtn));
});

runner.test('getAlertDescription: genere la description correcte', () => {
  assertEqual(
    getAlertDescription({ type: 'success', message: 'Sauvegarde' }),
    'Succes : Sauvegarde',
  );
  assertEqual(
    getAlertDescription({ type: 'error', message: 'Echec', retryAction: () => {} }),
    'Erreur : Echec (retry disponible)',
  );
  assertEqual(
    getAlertDescription({ type: 'warning', message: 'Attention', level: 2 }),
    'Attention (niveau 2) : Attention',
  );
  assertEqual(
    getAlertDescription({ type: 'info', message: 'Note' }),
    'Info : Note',
  );
});

// ─── Run ────────────────────────────────────────────────────────────────────

runner.run();
