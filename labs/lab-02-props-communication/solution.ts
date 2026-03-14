// ─── Lab 02 — Props et communication (Solution) ─────────────────────────────
// Lancer : npx tsx labs/lab-02-props-communication/solution.ts
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

export interface PropSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'function' | 'object' | 'array';
    required?: boolean;
    defaultValue?: unknown;
    validator?: (value: unknown) => boolean;
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface EventEmitter<Events extends Record<string, unknown>> {
  on<K extends keyof Events>(event: K, listener: (payload: Events[K]) => void): void;
  off<K extends keyof Events>(event: K, listener: (payload: Events[K]) => void): void;
  emit<K extends keyof Events>(event: K, payload: Events[K]): void;
  listenerCount<K extends keyof Events>(event: K): number;
}

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

export function validateProps(schema: PropSchema, props: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];

  for (const [key, def] of Object.entries(schema)) {
    const value = props[key];

    // Verifier les props requises
    if (def.required && (value === undefined || value === null)) {
      errors.push(`Prop requise manquante : "${key}"`);
      continue;
    }

    // Si la prop n'est pas presente et pas requise, on passe
    if (value === undefined || value === null) {
      continue;
    }

    // Verifier le type
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    if (actualType !== def.type) {
      errors.push(`Type incorrect pour "${key}" : attendu "${def.type}", recu "${actualType}"`);
      continue;
    }

    // Verifier le validator personnalise
    if (def.validator && !def.validator(value)) {
      errors.push(`Validation echouee pour "${key}"`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Exercice 2 : mergeDefaultProps
// ═══════════════════════════════════════════════════════════════════════════════

export function mergeDefaultProps(
  schema: PropSchema,
  props: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...props };

  for (const [key, def] of Object.entries(schema)) {
    if (result[key] === undefined && def.defaultValue !== undefined) {
      result[key] = def.defaultValue;
    }
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Exercice 3 : createEventEmitter
// ═══════════════════════════════════════════════════════════════════════════════

export function createEventEmitter<
  Events extends Record<string, unknown>,
>(): EventEmitter<Events> {
  const listeners = new Map<keyof Events, Set<(payload: any) => void>>();

  return {
    on<K extends keyof Events>(event: K, listener: (payload: Events[K]) => void): void {
      if (!listeners.has(event)) {
        listeners.set(event, new Set());
      }
      listeners.get(event)!.add(listener as any);
    },

    off<K extends keyof Events>(event: K, listener: (payload: Events[K]) => void): void {
      listeners.get(event)?.delete(listener as any);
    },

    emit<K extends keyof Events>(event: K, payload: Events[K]): void {
      const set = listeners.get(event);
      if (set) {
        for (const fn of set) {
          fn(payload);
        }
      }
    },

    listenerCount<K extends keyof Events>(event: K): number {
      return listeners.get(event)?.size ?? 0;
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Exercice 4 : createPropsProxy
// ═══════════════════════════════════════════════════════════════════════════════

export interface PropsProxy<T extends Record<string, unknown>> {
  get<K extends keyof T>(key: K): T[K];
  getKeys(): (keyof T)[];
  toObject(): T;
}

export function createPropsProxy<T extends Record<string, unknown>>(
  props: Partial<T>,
  defaults: T,
): PropsProxy<T> {
  return {
    get<K extends keyof T>(key: K): T[K] {
      if (key in props && props[key] !== undefined) {
        return props[key] as T[K];
      }
      return defaults[key];
    },

    getKeys(): (keyof T)[] {
      const allKeys = new Set<keyof T>([
        ...(Object.keys(props) as (keyof T)[]),
        ...(Object.keys(defaults) as (keyof T)[]),
      ]);
      return Array.from(allKeys);
    },

    toObject(): T {
      const result = { ...defaults };
      for (const key of Object.keys(props) as (keyof T)[]) {
        if (props[key] !== undefined) {
          result[key] = props[key] as T[keyof T];
        }
      }
      return result;
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Exercice 5 : Type guards pour discriminated unions
// ═══════════════════════════════════════════════════════════════════════════════

export function isErrorAlert(alert: AlertProps): alert is Extract<AlertProps, { type: 'error' }> {
  return alert.type === 'error';
}

export function isSuccessAlert(alert: AlertProps): alert is Extract<AlertProps, { type: 'success' }> {
  return alert.type === 'success';
}

export function isWarningAlert(alert: AlertProps): alert is Extract<AlertProps, { type: 'warning' }> {
  return alert.type === 'warning';
}

export function isIconButton(button: ButtonProps): button is Extract<ButtonProps, { variant: 'icon' }> {
  return button.variant === 'icon';
}

export function getAlertDescription(alert: AlertProps): string {
  switch (alert.type) {
    case 'success':
      return `Succes : ${alert.message}`;
    case 'error':
      return `Erreur : ${alert.message} (retry disponible)`;
    case 'warning':
      return `Attention (niveau ${alert.level}) : ${alert.message}`;
    case 'info':
      return `Info : ${alert.message}`;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════════

const runner = createTestRunner('Lab 02 — Props et communication (Solution)');

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
