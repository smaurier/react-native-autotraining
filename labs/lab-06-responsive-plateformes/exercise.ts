// =============================================================================
// Lab 06 — Responsive et plateformes (Exercices)
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
// Retourne le breakpoint en fonction de la largeur :
//   width < 768  → 'phone'
//   768 <= width < 1024 → 'tablet'
//   width >= 1024 → 'desktop'
// Doit lancer une erreur si width est negatif.
// =============================================================================

function getBreakpoint(_width: number): Breakpoint {
  // TODO: implementez la logique de breakpoint
  throw new Error('Not implemented');
}

// =============================================================================
// Exercice 2 : scaleFont
// Calcule la taille de police mise a l'echelle :
//   result = Math.round(baseSize * Math.min(fontScale, maxScale))
// - baseSize doit etre > 0 (sinon erreur)
// - fontScale doit etre > 0 (sinon erreur)
// - maxScale doit etre >= 1 (sinon erreur)
// =============================================================================

function scaleFont(_baseSize: number, _fontScale: number, _maxScale: number = 1.3): number {
  // TODO: implementez le scaling de police avec clamp
  throw new Error('Not implemented');
}

// =============================================================================
// Exercice 3 : platformSelect
// Selectionne une valeur en fonction de la plateforme.
// Cherche d'abord la cle correspondant a platform, puis 'default'.
// Si aucune valeur trouvee, lance une erreur.
// =============================================================================

function platformSelect<T>(_config: PlatformConfig<T>, _platform: PlatformOS): T {
  // TODO: implementez la selection par plateforme
  throw new Error('Not implemented');
}

// =============================================================================
// Exercice 4 : getOrientation
// Retourne 'landscape' si width > height, 'portrait' sinon.
// width et height doivent etre > 0 (sinon erreur).
// =============================================================================

function getOrientation(_width: number, _height: number): Orientation {
  // TODO: implementez la detection d'orientation
  throw new Error('Not implemented');
}

// =============================================================================
// Exercice 5 : createResponsiveValue
// Cree un objet ResponsiveValue<T> avec les 3 valeurs.
// =============================================================================

function createResponsiveValue<T>(_phone: T, _tablet: T, _desktop: T): ResponsiveValue<T> {
  // TODO: creez l'objet ResponsiveValue
  throw new Error('Not implemented');
}

// =============================================================================
// Exercice 6 : resolveResponsiveValue
// Resout la valeur correspondant au breakpoint courant.
// =============================================================================

function resolveResponsiveValue<T>(_responsiveValue: ResponsiveValue<T>, _breakpoint: Breakpoint): T {
  // TODO: retournez la valeur pour le breakpoint donne
  throw new Error('Not implemented');
}

// =============================================================================
// Exercice 7 : computeSafeAreaPadding
// Combine les safe area insets avec un padding minimum.
// Pour chaque cote, retourne max(inset, minPadding).
// =============================================================================

function computeSafeAreaPadding(
  _insets: SafeAreaInsets,
  _minPadding: number,
): SafeAreaInsets {
  // TODO: combinez insets et padding minimum
  throw new Error('Not implemented');
}

// =============================================================================
// Exercice 8 : getScreenInfo
// Retourne un objet ScreenInfo complet a partir de width et height.
// isSmall = true si breakpoint === 'phone'
// =============================================================================

function getScreenInfo(_width: number, _height: number): ScreenInfo {
  // TODO: construisez l'objet ScreenInfo
  throw new Error('Not implemented');
}

// =============================================================================
// Exercice 9 : scaleDimension
// Retourne les dimensions physiques en pixels en appliquant un facteur d'echelle.
//   width: Math.round(logicalWidth * pixelRatio)
//   height: Math.round(logicalHeight * pixelRatio)
//   scale: pixelRatio
// pixelRatio doit etre > 0 (sinon erreur)
// =============================================================================

function scaleDimension(
  _logicalWidth: number,
  _logicalHeight: number,
  _pixelRatio: number,
): ScaledDimension {
  // TODO: calculez les dimensions physiques
  throw new Error('Not implemented');
}

// =============================================================================
// Exercice 10 : computeGridColumns
// Calcule le nombre de colonnes pour une grille responsive :
//   - Prend un containerWidth, un minItemWidth et un spacing
//   - Nombre de colonnes = Math.floor((containerWidth + spacing) / (minItemWidth + spacing))
//   - Minimum 1 colonne
//   - minItemWidth et spacing doivent etre >= 0 (sinon erreur)
//   - containerWidth doit etre > 0 (sinon erreur)
// =============================================================================

function computeGridColumns(
  _containerWidth: number,
  _minItemWidth: number,
  _spacing: number,
): number {
  // TODO: calculez le nombre de colonnes
  throw new Error('Not implemented');
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
