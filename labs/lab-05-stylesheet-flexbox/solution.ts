import {
  createTestRunner,
  assertEqual,
  assertDeepEqual,
  assertTrue,
  assertFalse,
  assertGreaterThan,
  assertLessThan,
  assertLength,
} from '../test-utils.ts';

// ─── Types ───────────────────────────────────────────────────────────────────

interface FlexChild {
  flexGrow: number;
  flexShrink: number;
  flexBasis: number;
}

interface LayoutResult {
  offset: number;
  size: number;
}

interface GridItem {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Breakpoints {
  [name: string]: number;
}

interface PlatformStyle {
  common?: Record<string, unknown>;
  ios?: Record<string, unknown>;
  android?: Record<string, unknown>;
}

// ─── Exercice 1 : computeFlexLayout ────────────────────────────────────────

function computeFlexLayout(containerSize: number, children: FlexChild[]): LayoutResult[] {
  // 1. Somme des bases
  const totalBasis = children.reduce((sum, c) => sum + c.flexBasis, 0);

  // 2. Espace libre
  const freeSpace = containerSize - totalBasis;

  // 3. Calculer les tailles
  const sizes: number[] = [];

  if (freeSpace >= 0) {
    const totalGrow = children.reduce((sum, c) => sum + c.flexGrow, 0);
    for (const child of children) {
      if (totalGrow > 0) {
        sizes.push(child.flexBasis + freeSpace * (child.flexGrow / totalGrow));
      } else {
        sizes.push(child.flexBasis);
      }
    }
  } else {
    const totalShrink = children.reduce((sum, c) => sum + c.flexShrink, 0);
    for (const child of children) {
      if (totalShrink > 0) {
        sizes.push(child.flexBasis + freeSpace * (child.flexShrink / totalShrink));
      } else {
        sizes.push(child.flexBasis);
      }
    }
  }

  // 4. Calculer les offsets
  let offset = 0;
  const results: LayoutResult[] = [];

  for (const size of sizes) {
    results.push({ offset, size });
    offset += size;
  }

  return results;
}

// ─── Exercice 2 : mergeStyles ───────────────────────────────────────────────

function mergeStyles(
  ...styles: (Record<string, unknown> | undefined | false | null)[]
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const style of styles) {
    if (style) {
      Object.assign(result, style);
    }
  }

  return result;
}

// ─── Exercice 3 : resolveResponsiveValue ────────────────────────────────────

function resolveResponsiveValue(
  value: Record<string, number>,
  screenWidth: number,
  breakpoints: Breakpoints,
): number {
  // Trier les breakpoints du plus grand au plus petit
  const sortedBreakpoints = Object.entries(breakpoints)
    .sort(([, a], [, b]) => b - a);

  for (const [name, minWidth] of sortedBreakpoints) {
    if (screenWidth >= minWidth && value[name] !== undefined) {
      return value[name];
    }
  }

  // Fallback : valeur 'base' ou premiere valeur
  return value.base ?? Object.values(value)[0];
}

// ─── Exercice 4 : createGridLayout ──────────────────────────────────────────

function createGridLayout(
  columns: number,
  gap: number,
  containerWidth: number,
  itemCount: number,
): GridItem[] {
  const itemWidth = (containerWidth - gap * (columns + 1)) / columns;
  const itemHeight = itemWidth;

  const items: GridItem[] = [];

  for (let i = 0; i < itemCount; i++) {
    const col = i % columns;
    const row = Math.floor(i / columns);

    items.push({
      x: gap + col * (itemWidth + gap),
      y: gap + row * (itemHeight + gap),
      width: itemWidth,
      height: itemHeight,
    });
  }

  return items;
}

// ─── Exercice 5 : extractPlatformStyle ──────────────────────────────────────

function extractPlatformStyle(
  style: PlatformStyle,
  platform: 'ios' | 'android',
): Record<string, unknown> {
  return {
    ...style.common,
    ...style[platform],
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════════

const runner = createTestRunner('Lab 05 — StyleSheet et Flexbox');

// ─── Tests computeFlexLayout ────────────────────────────────────────────────

runner.test('computeFlexLayout: espace libre distribue par flexGrow', () => {
  const result = computeFlexLayout(300, [
    { flexGrow: 1, flexShrink: 0, flexBasis: 50 },
    { flexGrow: 2, flexShrink: 0, flexBasis: 50 },
    { flexGrow: 0, flexShrink: 0, flexBasis: 50 },
  ]);
  assertLength(result, 3);
  assertEqual(result[0].size, 100);
  assertEqual(result[1].size, 150);
  assertEqual(result[2].size, 50);
  assertEqual(result[0].offset, 0);
  assertEqual(result[1].offset, 100);
  assertEqual(result[2].offset, 250);
});

runner.test('computeFlexLayout: pas de flexGrow, elements gardes a leur basis', () => {
  const result = computeFlexLayout(400, [
    { flexGrow: 0, flexShrink: 0, flexBasis: 100 },
    { flexGrow: 0, flexShrink: 0, flexBasis: 100 },
  ]);
  assertLength(result, 2);
  assertEqual(result[0].size, 100);
  assertEqual(result[1].size, 100);
  assertEqual(result[0].offset, 0);
  assertEqual(result[1].offset, 100);
});

runner.test('computeFlexLayout: retrecissement avec flexShrink', () => {
  const result = computeFlexLayout(200, [
    { flexGrow: 0, flexShrink: 1, flexBasis: 150 },
    { flexGrow: 0, flexShrink: 1, flexBasis: 150 },
  ]);
  assertLength(result, 2);
  assertEqual(result[0].size, 100);
  assertEqual(result[1].size, 100);
});

runner.test('computeFlexLayout: retrecissement inegal', () => {
  const result = computeFlexLayout(200, [
    { flexGrow: 0, flexShrink: 3, flexBasis: 150 },
    { flexGrow: 0, flexShrink: 1, flexBasis: 150 },
  ]);
  assertEqual(result[0].size, 75);
  assertEqual(result[1].size, 125);
});

runner.test('computeFlexLayout: flex proportionnel (1:1:1)', () => {
  const result = computeFlexLayout(300, [
    { flexGrow: 1, flexShrink: 0, flexBasis: 0 },
    { flexGrow: 1, flexShrink: 0, flexBasis: 0 },
    { flexGrow: 1, flexShrink: 0, flexBasis: 0 },
  ]);
  assertEqual(result[0].size, 100);
  assertEqual(result[1].size, 100);
  assertEqual(result[2].size, 100);
});

// ─── Tests mergeStyles ──────────────────────────────────────────────────────

runner.test('mergeStyles: fusionne deux objets', () => {
  const result = mergeStyles(
    { padding: 8, backgroundColor: 'red' },
    { padding: 16, color: 'white' },
  );
  assertEqual(result.padding, 16);
  assertEqual(result.backgroundColor, 'red');
  assertEqual(result.color, 'white');
});

runner.test('mergeStyles: ignore les valeurs falsy', () => {
  const result = mergeStyles(
    { padding: 8 },
    undefined,
    false,
    null,
    { margin: 4 },
  );
  assertEqual(result.padding, 8);
  assertEqual(result.margin, 4);
});

runner.test('mergeStyles: dernier style gagne', () => {
  const result = mergeStyles(
    { color: 'red' },
    { color: 'blue' },
    { color: 'green' },
  );
  assertEqual(result.color, 'green');
});

// ─── Tests resolveResponsiveValue ───────────────────────────────────────────

runner.test('resolveResponsiveValue: retourne base pour petit ecran', () => {
  const breakpoints = { sm: 480, md: 768, lg: 1024 };
  const value = { base: 8, sm: 12, md: 16, lg: 24 };
  const result = resolveResponsiveValue(value, 320, breakpoints);
  assertEqual(result, 8);
});

runner.test('resolveResponsiveValue: retourne sm pour ecran moyen-petit', () => {
  const breakpoints = { sm: 480, md: 768, lg: 1024 };
  const value = { base: 8, sm: 12, md: 16, lg: 24 };
  const result = resolveResponsiveValue(value, 600, breakpoints);
  assertEqual(result, 12);
});

runner.test('resolveResponsiveValue: retourne lg pour grand ecran', () => {
  const breakpoints = { sm: 480, md: 768, lg: 1024 };
  const value = { base: 8, sm: 12, md: 16, lg: 24 };
  const result = resolveResponsiveValue(value, 1200, breakpoints);
  assertEqual(result, 24);
});

runner.test('resolveResponsiveValue: saute un breakpoint absent de value', () => {
  const breakpoints = { sm: 480, md: 768, lg: 1024 };
  const value = { base: 8, lg: 24 };
  const result = resolveResponsiveValue(value, 800, breakpoints);
  assertEqual(result, 8);
});

// ─── Tests createGridLayout ─────────────────────────────────────────────────

runner.test('createGridLayout: grille 2 colonnes', () => {
  const items = createGridLayout(2, 10, 320, 4);
  assertLength(items, 4);
  assertEqual(items[0].width, 145);
  assertEqual(items[0].x, 10);
  assertEqual(items[0].y, 10);
  assertEqual(items[1].x, 165);
  assertEqual(items[1].y, 10);
  assertEqual(items[2].x, 10);
  assertEqual(items[2].y, 165);
  assertEqual(items[3].x, 165);
  assertEqual(items[3].y, 165);
});

runner.test('createGridLayout: grille 3 colonnes 5 elements', () => {
  const items = createGridLayout(3, 8, 360, 5);
  assertLength(items, 5);
  const expectedWidth = (360 - 8 * 4) / 3;
  assertEqual(items[0].width, expectedWidth);
  assertEqual(items[0].height, expectedWidth);
  assertEqual(items[4].x, 8 + 1 * (expectedWidth + 8));
  assertEqual(items[4].y, 8 + 1 * (expectedWidth + 8));
});

runner.test('createGridLayout: 0 elements retourne tableau vide', () => {
  const items = createGridLayout(3, 8, 360, 0);
  assertLength(items, 0);
});

// ─── Tests extractPlatformStyle ─────────────────────────────────────────────

runner.test('extractPlatformStyle: fusionne common + ios', () => {
  const style: PlatformStyle = {
    common: { backgroundColor: '#fff', borderRadius: 12 },
    ios: { shadowColor: '#000', shadowOpacity: 0.1 },
    android: { elevation: 3 },
  };
  const result = extractPlatformStyle(style, 'ios');
  assertEqual(result.backgroundColor, '#fff');
  assertEqual(result.borderRadius, 12);
  assertEqual(result.shadowColor, '#000');
  assertEqual(result.shadowOpacity, 0.1);
  assertEqual(result.elevation, undefined);
});

runner.test('extractPlatformStyle: fusionne common + android', () => {
  const style: PlatformStyle = {
    common: { backgroundColor: '#fff', borderRadius: 12 },
    ios: { shadowColor: '#000' },
    android: { elevation: 3 },
  };
  const result = extractPlatformStyle(style, 'android');
  assertEqual(result.backgroundColor, '#fff');
  assertEqual(result.borderRadius, 12);
  assertEqual(result.elevation, 3);
  assertEqual(result.shadowColor, undefined);
});

runner.test('extractPlatformStyle: plateforme surcharge common', () => {
  const style: PlatformStyle = {
    common: { padding: 16, backgroundColor: '#fff' },
    ios: { padding: 20 },
  };
  const result = extractPlatformStyle(style, 'ios');
  assertEqual(result.padding, 20);
  assertEqual(result.backgroundColor, '#fff');
});

runner.test('extractPlatformStyle: sans common', () => {
  const style: PlatformStyle = {
    ios: { shadowColor: '#000' },
  };
  const result = extractPlatformStyle(style, 'ios');
  assertEqual(result.shadowColor, '#000');
});

runner.run();
