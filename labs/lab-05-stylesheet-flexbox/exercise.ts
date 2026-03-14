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

/**
 * Calcule le layout Flexbox simplifie (axe principal uniquement).
 *
 * Algorithme :
 * 1. Calculer l'espace libre = containerSize - somme des flexBasis
 * 2. Si espace libre >= 0 : distribuer selon flexGrow
 *    - Chaque enfant recoit : basis + (freeSpace * grow / totalGrow)
 *    - Si totalGrow = 0, chaque enfant garde sa basis
 * 3. Si espace libre < 0 : retrecir selon flexShrink
 *    - Chaque enfant recoit : basis + (deficit * shrink / totalShrink)
 *    - Si totalShrink = 0, chaque enfant garde sa basis (debordement)
 * 4. Calculer les offsets cumulatifs
 */
function computeFlexLayout(containerSize: number, children: FlexChild[]): LayoutResult[] {
  // TODO: implementer le calcul de layout Flexbox
  return [];
}

// ─── Exercice 2 : mergeStyles ───────────────────────────────────────────────

/**
 * Fusionne plusieurs objets de style avec strategie "last-wins".
 * - Les valeurs undefined, null et false sont ignorees
 * - Les proprietes du dernier style ecrasent celles des precedents
 * - Retourne un nouvel objet (pas de mutation)
 */
function mergeStyles(
  ...styles: (Record<string, unknown> | undefined | false | null)[]
): Record<string, unknown> {
  // TODO: implementer la fusion de styles
  return {};
}

// ─── Exercice 3 : resolveResponsiveValue ────────────────────────────────────

/**
 * Resout une valeur responsive en fonction de la largeur de l'ecran.
 *
 * - value est un objet { base: N, sm: N, md: N, lg: N }
 * - breakpoints definit les largeurs minimales : { sm: 480, md: 768, lg: 1024 }
 * - Retourne la valeur du plus grand breakpoint dont la largeur est <= screenWidth
 * - Si aucun breakpoint ne correspond, retourne value.base (ou la premiere valeur)
 */
function resolveResponsiveValue(
  value: Record<string, number>,
  screenWidth: number,
  breakpoints: Breakpoints,
): number {
  // TODO: implementer la resolution responsive
  return 0;
}

// ─── Exercice 4 : createGridLayout ──────────────────────────────────────────

/**
 * Calcule les positions d'une grille reguliere.
 *
 * - columns: nombre de colonnes
 * - gap: espace entre les elements et les bords
 * - containerWidth: largeur du conteneur
 * - itemCount: nombre d'elements
 *
 * Chaque element est un carre dont la largeur vaut :
 *   (containerWidth - gap * (columns + 1)) / columns
 *
 * Positions :
 *   x = gap + col * (itemWidth + gap)
 *   y = gap + row * (itemHeight + gap)
 */
function createGridLayout(
  columns: number,
  gap: number,
  containerWidth: number,
  itemCount: number,
): GridItem[] {
  // TODO: implementer le calcul de grille
  return [];
}

// ─── Exercice 5 : extractPlatformStyle ──────────────────────────────────────

/**
 * Extrait et fusionne les styles pour une plateforme donnee.
 *
 * - Commence par les styles `common`
 * - Fusionne par-dessus les styles de la plateforme (ios ou android)
 * - Si common ou la plateforme est undefined, les ignorer
 * - Retourne un objet fusionne
 */
function extractPlatformStyle(
  style: PlatformStyle,
  platform: 'ios' | 'android',
): Record<string, unknown> {
  // TODO: implementer l'extraction de styles par plateforme
  return {};
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
  // Espace libre = 300 - 150 = 150. totalGrow = 3.
  // Enfant 0: 50 + 150*(1/3) = 100. Enfant 1: 50 + 150*(2/3) = 150. Enfant 2: 50.
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
  // Deficit = 200 - 300 = -100. totalShrink = 2.
  // Enfant 0: 150 + (-100)*(1/2) = 100. Enfant 1: 100.
  assertLength(result, 2);
  assertEqual(result[0].size, 100);
  assertEqual(result[1].size, 100);
});

runner.test('computeFlexLayout: retrecissement inegal', () => {
  const result = computeFlexLayout(200, [
    { flexGrow: 0, flexShrink: 3, flexBasis: 150 },
    { flexGrow: 0, flexShrink: 1, flexBasis: 150 },
  ]);
  // Deficit = -100. totalShrink = 4.
  // Enfant 0: 150 + (-100)*(3/4) = 75. Enfant 1: 150 + (-100)*(1/4) = 125.
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
  const value = { base: 8, lg: 24 };  // Pas de sm ni md
  const result = resolveResponsiveValue(value, 800, breakpoints);
  // md (768) <= 800, mais value.md n'existe pas. sm (480) <= 800, mais value.sm n'existe pas.
  // Fallback a base.
  assertEqual(result, 8);
});

// ─── Tests createGridLayout ─────────────────────────────────────────────────

runner.test('createGridLayout: grille 2 colonnes', () => {
  const items = createGridLayout(2, 10, 320, 4);
  assertLength(items, 4);
  // itemWidth = (320 - 10*3) / 2 = 145
  assertEqual(items[0].width, 145);
  assertEqual(items[0].x, 10);
  assertEqual(items[0].y, 10);
  assertEqual(items[1].x, 165); // 10 + 145 + 10
  assertEqual(items[1].y, 10);
  assertEqual(items[2].x, 10);
  assertEqual(items[2].y, 165); // 10 + 145 + 10
  assertEqual(items[3].x, 165);
  assertEqual(items[3].y, 165);
});

runner.test('createGridLayout: grille 3 colonnes 5 elements', () => {
  const items = createGridLayout(3, 8, 360, 5);
  assertLength(items, 5);
  // itemWidth = (360 - 8*4) / 3 = (360 - 32) / 3 = 328/3 ≈ 109.33
  const expectedWidth = (360 - 8 * 4) / 3;
  assertEqual(items[0].width, expectedWidth);
  assertEqual(items[0].height, expectedWidth);
  // Dernier element (index 4) : col=1, row=1
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
