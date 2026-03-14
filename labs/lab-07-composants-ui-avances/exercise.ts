// =============================================================================
// Lab 07 — Composants UI avances (Exercices)
// =============================================================================

import {
  createTestRunner,
  assertEqual,
  assertDeepEqual,
  assertTrue,
  assertFalse,
  assertThrows,
} from '../test-utils.ts';

// =============================================================================
// Types
// =============================================================================

interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  error: string;
}

interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

interface ThemeTokens {
  colors: ThemeColors;
  spacing: ThemeSpacing;
  borderRadius: { sm: number; md: number; lg: number };
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface ToastQueue {
  add: (message: string, type: Toast['type']) => string;
  dismiss: (id: string) => void;
  getVisible: () => Toast[];
  getAll: () => Toast[];
  clear: () => void;
}

interface AccessibilityProps {
  accessibilityRole: string;
  accessibilityLabel: string;
  accessibilityState: Record<string, boolean>;
}

interface CompoundNode {
  type: string;
  props: Record<string, unknown>;
  children: CompoundNode[];
}

interface HitSlopResult {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

interface BadgeConfig {
  count: number;
  maxCount: number;
  visible: boolean;
}

interface BadgeResult {
  display: string;
  showBadge: boolean;
}

// =============================================================================
// Exercice 1 : createTheme
// Cree un objet ThemeTokens a partir des couleurs fournies.
// Le spacing et borderRadius sont les memes pour tout theme :
//   spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 }
//   borderRadius: { sm: 4, md: 8, lg: 16 }
// =============================================================================

function createTheme(_colors: ThemeColors): ThemeTokens {
  // TODO: creez le theme complet
  throw new Error('Not implemented');
}

// =============================================================================
// Exercice 2 : mergeThemes
// Fusionne deux themes. Les valeurs de override remplacent celles de base.
// Fusion profonde : colors, spacing et borderRadius sont fusionnes independamment.
// =============================================================================

function mergeThemes(
  _base: ThemeTokens,
  _override: Partial<ThemeTokens>,
): ThemeTokens {
  // TODO: fusionnez les deux themes
  throw new Error('Not implemented');
}

// =============================================================================
// Exercice 3 : createToastQueue
// Cree une file de toasts avec un nombre maximum visible.
// - add(message, type): ajoute un toast, retourne son id (genere via un compteur interne)
// - dismiss(id): supprime un toast par id
// - getVisible(): retourne les N premiers toasts (N = maxVisible)
// - getAll(): retourne tous les toasts
// - clear(): vide la file
// Le format de l'id est 'toast-{counter}' avec counter commencant a 1.
// =============================================================================

function createToastQueue(_maxVisible: number): ToastQueue {
  // TODO: implementez la file de toasts
  throw new Error('Not implemented');
}

// =============================================================================
// Exercice 4 : createAccessibilityProps
// Cree un objet de proprietes d'accessibilite React Native.
// - role: le role (ex: 'button', 'link', 'switch')
// - label: le label d'accessibilite
// - state: objet avec des booleens (ex: { disabled: true, selected: false })
// Validation : role et label ne doivent pas etre vides (sinon erreur).
// =============================================================================

function createAccessibilityProps(
  _role: string,
  _label: string,
  _state: Record<string, boolean>,
): AccessibilityProps {
  // TODO: creez l'objet d'accessibilite
  throw new Error('Not implemented');
}

// =============================================================================
// Exercice 5 : buildCompoundComponent
// Construit un arbre de composants (compound component pattern).
// - parentType: le type du composant parent (ex: 'Select')
// - parentProps: les props du parent
// - children: tableau de { type, props } pour les enfants
// Retourne un CompoundNode avec le parent et ses enfants.
// Chaque enfant a un tableau children vide.
// =============================================================================

function buildCompoundComponent(
  _parentType: string,
  _parentProps: Record<string, unknown>,
  _children: Array<{ type: string; props: Record<string, unknown> }>,
): CompoundNode {
  // TODO: construisez l'arbre compound component
  throw new Error('Not implemented');
}

// =============================================================================
// Exercice 6 : computeHitSlop
// Calcule le hitSlop necessaire pour atteindre une taille cible tactile.
// Si l'element fait actualWidth x actualHeight, et la cible est targetSize,
// le hitSlop de chaque cote est max(0, (targetSize - actual) / 2).
// Les valeurs sont arrondies vers le haut (Math.ceil).
// =============================================================================

function computeHitSlop(
  _actualWidth: number,
  _actualHeight: number,
  _targetSize: number,
): HitSlopResult {
  // TODO: calculez le hitSlop
  throw new Error('Not implemented');
}

// =============================================================================
// Exercice 7 : formatBadge
// Determine l'affichage d'un badge :
// - Si count > maxCount, display = '{maxCount}+'
// - Sinon display = '{count}'
// - showBadge = visible && count > 0
// =============================================================================

function formatBadge(_config: BadgeConfig): BadgeResult {
  // TODO: calculez l'affichage du badge
  throw new Error('Not implemented');
}

// =============================================================================
// Exercice 8 : getKeyboardAvoidingBehavior
// Retourne le behavior recommande pour KeyboardAvoidingView par plateforme :
//   'ios' → 'padding'
//   'android' → 'height'
//   autre → 'padding' (default)
// =============================================================================

function getKeyboardAvoidingBehavior(
  _platform: string,
): 'padding' | 'height' | 'position' {
  // TODO: retournez le behavior par plateforme
  throw new Error('Not implemented');
}

// =============================================================================
// Exercice 9 : createChipState
// Gere l'etat d'un groupe de chips (selection multiple).
// - selectedIds: Set d'identifiants selectionnes
// - toggle(id): ajoute si absent, supprime si present
// - isSelected(id): retourne true si l'id est selectionne
// - getSelected(): retourne un tableau trie des ids selectionnes
// - clear(): vide la selection
// =============================================================================

interface ChipGroupState {
  toggle: (id: string) => void;
  isSelected: (id: string) => boolean;
  getSelected: () => string[];
  clear: () => void;
}

function createChipState(): ChipGroupState {
  // TODO: implementez la gestion d'etat des chips
  throw new Error('Not implemented');
}

// =============================================================================
// Exercice 10 : buildAvatarInitials
// Genere les initiales a partir d'un nom :
// - Prend les premieres lettres de chaque mot
// - Maximum 2 caracteres
// - En majuscules
// - Si le nom est vide, retourne '?'
// =============================================================================

function buildAvatarInitials(_name: string): string {
  // TODO: generez les initiales
  throw new Error('Not implemented');
}

// =============================================================================
// Tests
// =============================================================================

const runner = createTestRunner('Lab 07 — Composants UI avances');

// --- createTheme ---

runner.test('createTheme: retourne un theme avec les couleurs fournies', () => {
  const theme = createTheme({
    primary: '#2196F3',
    secondary: '#FF9800',
    background: '#FFFFFF',
    text: '#212121',
    error: '#D32F2F',
  });
  assertEqual(theme.colors.primary, '#2196F3');
  assertEqual(theme.spacing.md, 16);
  assertEqual(theme.borderRadius.lg, 16);
});

runner.test('createTheme: spacing et borderRadius sont corrects', () => {
  const theme = createTheme({
    primary: '#000',
    secondary: '#111',
    background: '#222',
    text: '#333',
    error: '#444',
  });
  assertDeepEqual(theme.spacing, { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 });
  assertDeepEqual(theme.borderRadius, { sm: 4, md: 8, lg: 16 });
});

// --- mergeThemes ---

runner.test('mergeThemes: override partiel des couleurs', () => {
  const base = createTheme({
    primary: '#2196F3',
    secondary: '#FF9800',
    background: '#FFFFFF',
    text: '#212121',
    error: '#D32F2F',
  });
  const merged = mergeThemes(base, {
    colors: { primary: '#6200EE' } as ThemeColors,
  });
  assertEqual(merged.colors.primary, '#6200EE');
  assertEqual(merged.colors.secondary, '#FF9800'); // inchange
});

runner.test('mergeThemes: override du spacing', () => {
  const base = createTheme({
    primary: '#000',
    secondary: '#111',
    background: '#222',
    text: '#333',
    error: '#444',
  });
  const merged = mergeThemes(base, {
    spacing: { md: 20 } as ThemeSpacing,
  });
  assertEqual(merged.spacing.md, 20);
  assertEqual(merged.spacing.sm, 8); // inchange
});

runner.test('mergeThemes: sans override retourne une copie du base', () => {
  const base = createTheme({
    primary: '#000',
    secondary: '#111',
    background: '#222',
    text: '#333',
    error: '#444',
  });
  const merged = mergeThemes(base, {});
  assertDeepEqual(merged, base);
});

// --- createToastQueue ---

runner.test('createToastQueue: ajouter des toasts', () => {
  const queue = createToastQueue(3);
  const id1 = queue.add('Hello', 'info');
  const id2 = queue.add('Error!', 'error');
  assertEqual(id1, 'toast-1');
  assertEqual(id2, 'toast-2');
  assertEqual(queue.getAll().length, 2);
});

runner.test('createToastQueue: getVisible respecte maxVisible', () => {
  const queue = createToastQueue(2);
  queue.add('Toast 1', 'info');
  queue.add('Toast 2', 'success');
  queue.add('Toast 3', 'warning');
  assertEqual(queue.getVisible().length, 2);
  assertEqual(queue.getAll().length, 3);
});

runner.test('createToastQueue: dismiss supprime un toast', () => {
  const queue = createToastQueue(5);
  const id = queue.add('To dismiss', 'info');
  queue.add('Keep', 'success');
  queue.dismiss(id);
  assertEqual(queue.getAll().length, 1);
  assertEqual(queue.getAll()[0].message, 'Keep');
});

runner.test('createToastQueue: clear vide tout', () => {
  const queue = createToastQueue(5);
  queue.add('A', 'info');
  queue.add('B', 'error');
  queue.clear();
  assertEqual(queue.getAll().length, 0);
});

runner.test('createToastQueue: getVisible retourne les premiers', () => {
  const queue = createToastQueue(2);
  queue.add('First', 'info');
  queue.add('Second', 'success');
  queue.add('Third', 'warning');
  const visible = queue.getVisible();
  assertEqual(visible[0].message, 'First');
  assertEqual(visible[1].message, 'Second');
});

// --- createAccessibilityProps ---

runner.test('createAccessibilityProps: cree les props correctement', () => {
  const props = createAccessibilityProps('button', 'Sauvegarder', { disabled: false });
  assertEqual(props.accessibilityRole, 'button');
  assertEqual(props.accessibilityLabel, 'Sauvegarder');
  assertDeepEqual(props.accessibilityState, { disabled: false });
});

runner.test('createAccessibilityProps: role vide → erreur', () => {
  assertThrows(() => createAccessibilityProps('', 'Label', {}));
});

runner.test('createAccessibilityProps: label vide → erreur', () => {
  assertThrows(() => createAccessibilityProps('button', '', {}));
});

runner.test('createAccessibilityProps: etats multiples', () => {
  const props = createAccessibilityProps('switch', 'Mode sombre', {
    checked: true,
    disabled: false,
  });
  assertTrue(props.accessibilityState.checked);
  assertFalse(props.accessibilityState.disabled);
});

// --- buildCompoundComponent ---

runner.test('buildCompoundComponent: arbre avec enfants', () => {
  const tree = buildCompoundComponent(
    'Select',
    { value: 'FR' },
    [
      { type: 'Select.Option', props: { value: 'FR', label: 'France' } },
      { type: 'Select.Option', props: { value: 'BE', label: 'Belgique' } },
    ],
  );
  assertEqual(tree.type, 'Select');
  assertEqual(tree.children.length, 2);
  assertEqual(tree.children[0].type, 'Select.Option');
  assertEqual(tree.children[0].props.value, 'FR');
  assertEqual(tree.children[1].props.label, 'Belgique');
});

runner.test('buildCompoundComponent: enfants ont children vide', () => {
  const tree = buildCompoundComponent(
    'Tabs',
    {},
    [{ type: 'Tabs.Tab', props: { title: 'Home' } }],
  );
  assertDeepEqual(tree.children[0].children, []);
});

runner.test('buildCompoundComponent: sans enfants', () => {
  const tree = buildCompoundComponent('Card', { elevated: true }, []);
  assertEqual(tree.type, 'Card');
  assertEqual(tree.children.length, 0);
  assertTrue(tree.props.elevated as boolean);
});

// --- computeHitSlop ---

runner.test('computeHitSlop: petit bouton 24x24 → cible 44', () => {
  const slop = computeHitSlop(24, 24, 44);
  assertEqual(slop.top, 10);
  assertEqual(slop.bottom, 10);
  assertEqual(slop.left, 10);
  assertEqual(slop.right, 10);
});

runner.test('computeHitSlop: element assez grand → slop 0', () => {
  const slop = computeHitSlop(48, 48, 44);
  assertEqual(slop.top, 0);
  assertEqual(slop.bottom, 0);
  assertEqual(slop.left, 0);
  assertEqual(slop.right, 0);
});

runner.test('computeHitSlop: taille impaire → arrondi vers le haut', () => {
  const slop = computeHitSlop(25, 25, 44);
  // (44 - 25) / 2 = 9.5 → ceil = 10
  assertEqual(slop.top, 10);
  assertEqual(slop.left, 10);
});

// --- formatBadge ---

runner.test('formatBadge: count <= maxCount', () => {
  const result = formatBadge({ count: 5, maxCount: 99, visible: true });
  assertEqual(result.display, '5');
  assertTrue(result.showBadge);
});

runner.test('formatBadge: count > maxCount', () => {
  const result = formatBadge({ count: 150, maxCount: 99, visible: true });
  assertEqual(result.display, '99+');
  assertTrue(result.showBadge);
});

runner.test('formatBadge: count 0 → badge masque', () => {
  const result = formatBadge({ count: 0, maxCount: 99, visible: true });
  assertEqual(result.display, '0');
  assertFalse(result.showBadge);
});

runner.test('formatBadge: visible false → badge masque', () => {
  const result = formatBadge({ count: 5, maxCount: 99, visible: false });
  assertFalse(result.showBadge);
});

// --- getKeyboardAvoidingBehavior ---

runner.test('getKeyboardAvoidingBehavior: ios → padding', () => {
  assertEqual(getKeyboardAvoidingBehavior('ios'), 'padding');
});

runner.test('getKeyboardAvoidingBehavior: android → height', () => {
  assertEqual(getKeyboardAvoidingBehavior('android'), 'height');
});

runner.test('getKeyboardAvoidingBehavior: web → padding (default)', () => {
  assertEqual(getKeyboardAvoidingBehavior('web'), 'padding');
});

// --- createChipState ---

runner.test('createChipState: toggle ajoute et supprime', () => {
  const state = createChipState();
  state.toggle('a');
  assertTrue(state.isSelected('a'));
  state.toggle('a');
  assertFalse(state.isSelected('a'));
});

runner.test('createChipState: getSelected retourne un tableau trie', () => {
  const state = createChipState();
  state.toggle('c');
  state.toggle('a');
  state.toggle('b');
  assertDeepEqual(state.getSelected(), ['a', 'b', 'c']);
});

runner.test('createChipState: clear vide la selection', () => {
  const state = createChipState();
  state.toggle('a');
  state.toggle('b');
  state.clear();
  assertEqual(state.getSelected().length, 0);
});

// --- buildAvatarInitials ---

runner.test('buildAvatarInitials: deux mots', () => {
  assertEqual(buildAvatarInitials('Jean Dupont'), 'JD');
});

runner.test('buildAvatarInitials: trois mots → 2 max', () => {
  assertEqual(buildAvatarInitials('Jean Claude Dupont'), 'JC');
});

runner.test('buildAvatarInitials: un seul mot', () => {
  assertEqual(buildAvatarInitials('Alice'), 'A');
});

runner.test('buildAvatarInitials: minuscules → majuscules', () => {
  assertEqual(buildAvatarInitials('jean dupont'), 'JD');
});

runner.test('buildAvatarInitials: nom vide → ?', () => {
  assertEqual(buildAvatarInitials(''), '?');
});

runner.test('buildAvatarInitials: espaces seuls → ?', () => {
  assertEqual(buildAvatarInitials('   '), '?');
});

runner.run();
