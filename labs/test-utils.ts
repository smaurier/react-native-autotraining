// ─── Test runner pour le cours React Native ──────────────────────────────────
// Pattern identique aux autres cours : createTestRunner + assertions

export interface TestCase {
  name: string;
  fn: () => void | Promise<void>;
}

export interface TestRunner {
  test: (name: string, fn: () => void | Promise<void>) => void;
  run: () => Promise<void>;
}

export function createTestRunner(labName: string): TestRunner {
  const tests: TestCase[] = [];

  return {
    test(name: string, fn: () => void | Promise<void>) {
      tests.push({ name, fn });
    },

    async run() {
      console.log(`\n${'═'.repeat(50)}`);
      console.log(`  ${labName}`);
      console.log(`${'═'.repeat(50)}\n`);

      let passed = 0;
      let failed = 0;

      for (const t of tests) {
        try {
          await t.fn();
          console.log(`  ✅ ${t.name}`);
          passed++;
        } catch (err) {
          console.log(`  ❌ ${t.name}`);
          console.log(`     ${err instanceof Error ? err.message : String(err)}`);
          failed++;
        }
      }

      console.log(`\n${'─'.repeat(50)}`);
      console.log(`  Résultats : ${passed} passés, ${failed} échoués sur ${tests.length}`);
      console.log(`${'─'.repeat(50)}\n`);

      if (failed > 0) {
        process.exit(1);
      } else {
        console.log('🎉 Tous les tests passent !');
        console.log(`${'─'.repeat(50)}\n`);
      }
    },
  };
}

// ─── Assertions ──────────────────────────────────────────────────────────────

export function assertEqual<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    throw new Error(message ?? `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

export function assertDeepEqual<T>(actual: T, expected: T, message?: string): void {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) {
    throw new Error(message ?? `Expected ${b}, got ${a}`);
  }
}

export function assertTrue(value: boolean, message?: string): void {
  if (!value) {
    throw new Error(message ?? `Expected true, got ${value}`);
  }
}

export function assertFalse(value: boolean, message?: string): void {
  if (value) {
    throw new Error(message ?? `Expected false, got ${value}`);
  }
}

export function assertThrows(fn: () => void, message?: string): void {
  try {
    fn();
    throw new Error(message ?? 'Expected function to throw');
  } catch (err) {
    if (err instanceof Error && err.message === (message ?? 'Expected function to throw')) {
      throw err;
    }
    // OK — it threw as expected
  }
}

export function assertApprox(actual: number, expected: number, epsilon = 1e-6, message?: string): void {
  if (Math.abs(actual - expected) > epsilon) {
    throw new Error(message ?? `Expected ~${expected}, got ${actual} (epsilon=${epsilon})`);
  }
}

export function assertArrayApprox(actual: number[], expected: number[], epsilon = 1e-6, message?: string): void {
  if (actual.length !== expected.length) {
    throw new Error(message ?? `Array length mismatch: ${actual.length} vs ${expected.length}`);
  }
  for (let i = 0; i < actual.length; i++) {
    if (Math.abs(actual[i] - expected[i]) > epsilon) {
      throw new Error(
        message ?? `Element [${i}]: expected ~${expected[i]}, got ${actual[i]} (epsilon=${epsilon})`
      );
    }
  }
}

export function assertContains(haystack: string, needle: string, message?: string): void {
  if (!haystack.includes(needle)) {
    throw new Error(message ?? `Expected string to contain "${needle}"`);
  }
}

export function assertArrayContains<T>(arr: T[], item: T, message?: string): void {
  if (!arr.includes(item)) {
    throw new Error(message ?? `Expected array to contain ${JSON.stringify(item)}`);
  }
}

export function assertLength<T>(arr: T[], expected: number, message?: string): void {
  if (arr.length !== expected) {
    throw new Error(message ?? `Expected length ${expected}, got ${arr.length}`);
  }
}

export function assertNotNull<T>(value: T | null | undefined, message?: string): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message ?? `Expected non-null value, got ${value}`);
  }
}

export function assertGreaterThan(actual: number, expected: number, message?: string): void {
  if (actual <= expected) {
    throw new Error(message ?? `Expected ${actual} > ${expected}`);
  }
}

export function assertLessThan(actual: number, expected: number, message?: string): void {
  if (actual >= expected) {
    throw new Error(message ?? `Expected ${actual} < ${expected}`);
  }
}

// ─── Types React Native courants (pour les labs) ─────────────────────────────

/** Style simplifié pour les exercices Flexbox */
export interface FlexStyle {
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  flexWrap?: 'wrap' | 'nowrap' | 'wrap-reverse';
  flex?: number;
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: number | string;
  gap?: number;
  rowGap?: number;
  columnGap?: number;
  padding?: number;
  paddingHorizontal?: number;
  paddingVertical?: number;
  margin?: number;
  marginHorizontal?: number;
  marginVertical?: number;
  width?: number | string;
  height?: number | string;
  position?: 'relative' | 'absolute';
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

/** Props de composant generique */
export interface ComponentProps {
  [key: string]: unknown;
}

/** Route de navigation typee */
export interface Route<T extends string = string> {
  name: T;
  params?: Record<string, unknown>;
}

/** Navigation state simplifie */
export interface NavigationState {
  routes: Route[];
  index: number;
  history?: Route[];
}

/** Store simplifie pour les exercices state management */
export interface Store<T> {
  getState: () => T;
  setState: (partial: Partial<T> | ((state: T) => Partial<T>)) => void;
  subscribe: (listener: (state: T) => void) => () => void;
}

/** API response generique */
export interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

/** Animation config */
export interface AnimationConfig {
  type: 'timing' | 'spring' | 'decay';
  duration?: number;
  tension?: number;
  friction?: number;
  velocity?: number;
  toValue?: number;
  useNativeDriver?: boolean;
}

/** Offline queue item */
export interface QueueItem<T = unknown> {
  id: string;
  action: string;
  payload: T;
  timestamp: number;
  retryCount: number;
}

/** Performance metric */
export interface PerfMetric {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  metadata?: Record<string, unknown>;
}
