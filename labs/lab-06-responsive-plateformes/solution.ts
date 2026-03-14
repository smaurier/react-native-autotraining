// =============================================================================
// Lab 06 — Responsive et plateformes (Solutions)
// =============================================================================

import {
  createTestRunner,
  assertEqual,
  assertDeepEqual,
  assertTrue,
  assertThrows,
} from '../test-utils.ts';

// =============================================================================
// Types
// =============================================================================

type Breakpoint = 'phone' | 'tablet' | 'desktop';

type PlatformOS = 'ios' | 'android' | 'web';

interface PlatformConfig<T> {
  ios?: T;
  android?: T;
  web?: T;
  default?: T;
}

type Orientation = 'portrait' | 'landscape';

interface ResponsiveValue<T> {
  phone: T;
  tablet: T;
  desktop: T;
}

interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

interface ScreenInfo {
  width: number;
  height: number;
  breakpoint: Breakpoint;
  orientation: Orientation;
  isSmall: boolean;
}

interface ScaledDimension {
  width: number;
  height: number;
  scale: number;
}

// =============================================================================
// Exercice 1 : getBreakpoint
// =============================================================================

function getBreakpoint(width: number): Breakpoint {
  if (width < 0) throw new Error('Width must be non-negative');
  if (width >= 1024) return 'desktop';
  if (width >= 768) return 'tablet';
  return 'phone';
}

// =============================================================================
// Exercice 2 : scaleFont
// =============================================================================

function scaleFont(baseSize: number, fontScale: number, maxScale: number = 1.3): number {
  if (baseSize <= 0) throw new Error('baseSize must be positive');
  if (fontScale <= 0) throw new Error('fontScale must be positive');
  if (maxScale < 1) throw new Error('maxScale must be >= 1');

  const clampedScale = Math.min(fontScale, maxScale);
  return Math.round(baseSize * clampedScale);
}

// =============================================================================
// Exercice 3 : platformSelect
// =============================================================================

function platformSelect<T>(config: PlatformConfig<T>, platform: PlatformOS): T {
  if (platform in config && config[platform] !== undefined) {
    return config[platform] as T;
  }
  if ('default' in config && config.default !== undefined) {
    return config.default;
  }
  throw new Error(`No value for platform '${platform}' and no default`);
}

// =============================================================================
// Exercice 4 : getOrientation
// =============================================================================

function getOrientation(width: number, height: number): Orientation {
  if (width <= 0 || height <= 0) throw new Error('Dimensions must be positive');
  return width > height ? 'landscape' : 'portrait';
}

// =============================================================================
// Exercice 5 : createResponsiveValue
// =============================================================================

function createResponsiveValue<T>(phone: T, tablet: T, desktop: T): ResponsiveValue<T> {
  return { phone, tablet, desktop };
}

// =============================================================================
// Exercice 6 : resolveResponsiveValue
// =============================================================================

function resolveResponsiveValue<T>(responsiveValue: ResponsiveValue<T>, breakpoint: Breakpoint): T {
  return responsiveValue[breakpoint];
}

// =============================================================================
// Exercice 7 : computeSafeAreaPadding
// =============================================================================

function computeSafeAreaPadding(
  insets: SafeAreaInsets,
  minPadding: number,
): SafeAreaInsets {
  return {
    top: Math.max(insets.top, minPadding),
    bottom: Math.max(insets.bottom, minPadding),
    left: Math.max(insets.left, minPadding),
    right: Math.max(insets.right, minPadding),
  };
}

// =============================================================================
// Exercice 8 : getScreenInfo
// =============================================================================

function getScreenInfo(width: number, height: number): ScreenInfo {
  const breakpoint = getBreakpoint(width);
  const orientation = getOrientation(width, height);
  return {
    width,
    height,
    breakpoint,
    orientation,
    isSmall: breakpoint === 'phone',
  };
}

// =============================================================================
// Exercice 9 : scaleDimension
// =============================================================================

function scaleDimension(
  logicalWidth: number,
  logicalHeight: number,
  pixelRatio: number,
): ScaledDimension {
  if (pixelRatio <= 0) throw new Error('pixelRatio must be positive');
  return {
    width: Math.round(logicalWidth * pixelRatio),
    height: Math.round(logicalHeight * pixelRatio),
    scale: pixelRatio,
  };
}

// =============================================================================
// Exercice 10 : computeGridColumns
// =============================================================================

function computeGridColumns(
  containerWidth: number,
  minItemWidth: number,
  spacing: number,
): number {
  if (containerWidth <= 0) throw new Error('containerWidth must be positive');
  if (minItemWidth < 0) throw new Error('minItemWidth must be non-negative');
  if (spacing < 0) throw new Error('spacing must be non-negative');

  const columns = Math.floor((containerWidth + spacing) / (minItemWidth + spacing));
  return Math.max(columns, 1);
}

// =============================================================================
// Tests
// =============================================================================

const runner = createTestRunner('Lab 06 — Responsive et plateformes');

// --- getBreakpoint ---

runner.test('getBreakpoint: 320 → phone', () => {
  assertEqual(getBreakpoint(320), 'phone');
});

runner.test('getBreakpoint: 767 → phone', () => {
  assertEqual(getBreakpoint(767), 'phone');
});

runner.test('getBreakpoint: 768 → tablet', () => {
  assertEqual(getBreakpoint(768), 'tablet');
});

runner.test('getBreakpoint: 1023 → tablet', () => {
  assertEqual(getBreakpoint(1023), 'tablet');
});

runner.test('getBreakpoint: 1024 → desktop', () => {
  assertEqual(getBreakpoint(1024), 'desktop');
});

runner.test('getBreakpoint: 1440 → desktop', () => {
  assertEqual(getBreakpoint(1440), 'desktop');
});

runner.test('getBreakpoint: negatif → erreur', () => {
  assertThrows(() => getBreakpoint(-1));
});

// --- scaleFont ---

runner.test('scaleFont: base 16, scale 1.0 → 16', () => {
  assertEqual(scaleFont(16, 1.0), 16);
});

runner.test('scaleFont: base 16, scale 1.5, max 1.3 → 21 (clamp)', () => {
  assertEqual(scaleFont(16, 1.5, 1.3), 21);
});

runner.test('scaleFont: base 24, scale 2.0, max 1.5 → 36', () => {
  assertEqual(scaleFont(24, 2.0, 1.5), 36);
});

runner.test('scaleFont: base 16, scale 0.8 → 13 (pas de clamp vers le haut)', () => {
  assertEqual(scaleFont(16, 0.8, 1.3), 13);
});

runner.test('scaleFont: baseSize 0 → erreur', () => {
  assertThrows(() => scaleFont(0, 1.0));
});

runner.test('scaleFont: fontScale negatif → erreur', () => {
  assertThrows(() => scaleFont(16, -1));
});

runner.test('scaleFont: maxScale < 1 → erreur', () => {
  assertThrows(() => scaleFont(16, 1.0, 0.5));
});

// --- platformSelect ---

runner.test('platformSelect: selectionne ios', () => {
  const result = platformSelect({ ios: 44, android: 0, default: 20 }, 'ios');
  assertEqual(result, 44);
});

runner.test('platformSelect: selectionne android', () => {
  const result = platformSelect({ ios: 44, android: 0, default: 20 }, 'android');
  assertEqual(result, 0);
});

runner.test('platformSelect: fallback sur default', () => {
  const result = platformSelect({ ios: 44, default: 20 }, 'web');
  assertEqual(result, 20);
});

runner.test('platformSelect: aucune valeur → erreur', () => {
  assertThrows(() => platformSelect({ ios: 44 }, 'android'));
});

// --- getOrientation ---

runner.test('getOrientation: portrait (390x844)', () => {
  assertEqual(getOrientation(390, 844), 'portrait');
});

runner.test('getOrientation: landscape (844x390)', () => {
  assertEqual(getOrientation(844, 390), 'landscape');
});

runner.test('getOrientation: carre (500x500) → portrait', () => {
  assertEqual(getOrientation(500, 500), 'portrait');
});

runner.test('getOrientation: dimension negative → erreur', () => {
  assertThrows(() => getOrientation(-1, 100));
});

// --- createResponsiveValue & resolveResponsiveValue ---

runner.test('createResponsiveValue: cree un objet correct', () => {
  const rv = createResponsiveValue(2, 3, 4);
  assertDeepEqual(rv, { phone: 2, tablet: 3, desktop: 4 });
});

runner.test('resolveResponsiveValue: phone', () => {
  const rv = createResponsiveValue(14, 16, 18);
  assertEqual(resolveResponsiveValue(rv, 'phone'), 14);
});

runner.test('resolveResponsiveValue: tablet', () => {
  const rv = createResponsiveValue(14, 16, 18);
  assertEqual(resolveResponsiveValue(rv, 'tablet'), 16);
});

runner.test('resolveResponsiveValue: desktop', () => {
  const rv = createResponsiveValue(14, 16, 18);
  assertEqual(resolveResponsiveValue(rv, 'desktop'), 18);
});

// --- computeSafeAreaPadding ---

runner.test('computeSafeAreaPadding: insets plus grands que minPadding', () => {
  const result = computeSafeAreaPadding(
    { top: 59, bottom: 34, left: 0, right: 0 },
    16,
  );
  assertDeepEqual(result, { top: 59, bottom: 34, left: 16, right: 16 });
});

runner.test('computeSafeAreaPadding: minPadding plus grand', () => {
  const result = computeSafeAreaPadding(
    { top: 0, bottom: 0, left: 0, right: 0 },
    24,
  );
  assertDeepEqual(result, { top: 24, bottom: 24, left: 24, right: 24 });
});

// --- getScreenInfo ---

runner.test('getScreenInfo: iPhone portrait', () => {
  const info = getScreenInfo(390, 844);
  assertEqual(info.breakpoint, 'phone');
  assertEqual(info.orientation, 'portrait');
  assertTrue(info.isSmall);
  assertEqual(info.width, 390);
  assertEqual(info.height, 844);
});

runner.test('getScreenInfo: iPad landscape', () => {
  const info = getScreenInfo(1194, 834);
  assertEqual(info.breakpoint, 'desktop');
  assertEqual(info.orientation, 'landscape');
  assertEqual(info.isSmall, false);
});

// --- scaleDimension ---

runner.test('scaleDimension: ecran 2x', () => {
  const result = scaleDimension(390, 844, 2);
  assertDeepEqual(result, { width: 780, height: 1688, scale: 2 });
});

runner.test('scaleDimension: ecran 3x', () => {
  const result = scaleDimension(393, 852, 3);
  assertDeepEqual(result, { width: 1179, height: 2556, scale: 3 });
});

runner.test('scaleDimension: pixelRatio negatif → erreur', () => {
  assertThrows(() => scaleDimension(390, 844, -1));
});

// --- computeGridColumns ---

runner.test('computeGridColumns: 390px, items 100px, spacing 8 → 3', () => {
  assertEqual(computeGridColumns(390, 100, 8), 3);
});

runner.test('computeGridColumns: 768px, items 200px, spacing 16 → 3', () => {
  assertEqual(computeGridColumns(768, 200, 16), 3);
});

runner.test('computeGridColumns: tres petit → minimum 1', () => {
  assertEqual(computeGridColumns(50, 200, 8), 1);
});

runner.test('computeGridColumns: containerWidth 0 → erreur', () => {
  assertThrows(() => computeGridColumns(0, 100, 8));
});

runner.run();
