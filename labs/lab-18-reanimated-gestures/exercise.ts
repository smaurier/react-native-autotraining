// ============================================================================
// LAB 18 — Reanimated & Gesture Handler (logique pure)
// ============================================================================
// Objectif : comprendre les mecanismes internes de Reanimated et Gesture
// Handler en implementant leurs concepts fondamentaux en TypeScript pur.
// Lancez avec : npx tsx labs/lab-18-reanimated-gestures/exercise.ts
// ============================================================================

import {
  createTestRunner,
  assertEqual,
  assertDeepEqual,
  assertTrue,
  assertFalse,
  assertThrows,
} from '../test-utils.ts';

const runner = createTestRunner('Lab 18 — Reanimated & Gesture Handler (logique pure)');

// ============================================================================
// Types de base
// ============================================================================

interface SharedValue<T> {
  value: T;
}

interface GestureState {
  active: boolean;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
}

type SwipeDirection = 'left' | 'right' | 'up' | 'down' | 'none';

interface DragBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

interface AnimationKeyframe {
  progress: number; // 0 a 1
  value: number;
}

// ============================================================================
// Exercice 1 : createSharedValue
// ============================================================================
// Simule useSharedValue de Reanimated.
// Cree un objet avec une propriete `value` accessible en lecture/ecriture.
// La valeur initiale est passee en parametre.

function createSharedValue<T>(initial: T): SharedValue<T> {
  // TODO: Implementer cette fonction
  throw new Error('Non implemente');
}

runner.test('createSharedValue — valeur initiale numerique', () => {
  const sv = createSharedValue(0);
  assertEqual(sv.value, 0);
});

runner.test('createSharedValue — modification de la valeur', () => {
  const sv = createSharedValue(10);
  sv.value = 42;
  assertEqual(sv.value, 42);
});

runner.test('createSharedValue — valeur initiale string', () => {
  const sv = createSharedValue('hello');
  assertEqual(sv.value, 'hello');
  sv.value = 'world';
  assertEqual(sv.value, 'world');
});

runner.test('createSharedValue — valeur initiale objet', () => {
  const sv = createSharedValue({ x: 0, y: 0 });
  assertDeepEqual(sv.value, { x: 0, y: 0 });
  sv.value = { x: 100, y: 200 };
  assertDeepEqual(sv.value, { x: 100, y: 200 });
});

// ============================================================================
// Exercice 2 : clampValue
// ============================================================================
// Restreint une valeur entre un minimum et un maximum.
// Utilise massivement dans Reanimated pour limiter les animations
// (scale, translation, opacite, etc.).
// - Si value < min, retourner min
// - Si value > max, retourner max
// - Sinon retourner value

function clampValue(value: number, min: number, max: number): number {
  // TODO: Implementer cette fonction
  throw new Error('Non implemente');
}

runner.test('clampValue — valeur dans les bornes', () => {
  assertEqual(clampValue(50, 0, 100), 50);
});

runner.test('clampValue — valeur sous le minimum', () => {
  assertEqual(clampValue(-10, 0, 100), 0);
});

runner.test('clampValue — valeur au-dessus du maximum', () => {
  assertEqual(clampValue(150, 0, 100), 100);
});

runner.test('clampValue — bornes egales', () => {
  assertEqual(clampValue(50, 30, 30), 30);
});

// ============================================================================
// Exercice 3 : createGestureState
// ============================================================================
// Cree un objet representant l'etat d'un geste (comme un Pan gesture).
// Etat initial :
//   - active: false
//   - x: 0, y: 0
//   - velocityX: 0, velocityY: 0
// Methodes :
//   - begin(): active = true
//   - update(x, y, vx, vy): met a jour les positions et velocites
//   - end(): active = false, conserve les dernieres valeurs
//   - reset(): remet tout a l'etat initial

interface GestureStateManager {
  getState(): GestureState;
  begin(): void;
  update(x: number, y: number, velocityX: number, velocityY: number): void;
  end(): void;
  reset(): void;
}

function createGestureState(): GestureStateManager {
  // TODO: Implementer cette fonction
  throw new Error('Non implemente');
}

runner.test('createGestureState — etat initial', () => {
  const gs = createGestureState();
  const state = gs.getState();
  assertFalse(state.active);
  assertEqual(state.x, 0);
  assertEqual(state.y, 0);
  assertEqual(state.velocityX, 0);
  assertEqual(state.velocityY, 0);
});

runner.test('createGestureState — begin active le geste', () => {
  const gs = createGestureState();
  gs.begin();
  assertTrue(gs.getState().active);
});

runner.test('createGestureState — update modifie position et velocite', () => {
  const gs = createGestureState();
  gs.begin();
  gs.update(100, 50, 200, -100);
  const state = gs.getState();
  assertEqual(state.x, 100);
  assertEqual(state.y, 50);
  assertEqual(state.velocityX, 200);
  assertEqual(state.velocityY, -100);
});

runner.test('createGestureState — end desactive, conserve les valeurs', () => {
  const gs = createGestureState();
  gs.begin();
  gs.update(100, 50, 200, -100);
  gs.end();
  const state = gs.getState();
  assertFalse(state.active);
  assertEqual(state.x, 100);
  assertEqual(state.y, 50);
});

runner.test('createGestureState — reset remet tout a zero', () => {
  const gs = createGestureState();
  gs.begin();
  gs.update(100, 50, 200, -100);
  gs.end();
  gs.reset();
  const state = gs.getState();
  assertFalse(state.active);
  assertEqual(state.x, 0);
  assertEqual(state.y, 0);
  assertEqual(state.velocityX, 0);
  assertEqual(state.velocityY, 0);
});

// ============================================================================
// Exercice 4 : createSwipeDetector
// ============================================================================
// Detecte la direction d'un swipe basee sur un seuil (threshold).
// - onPan(deltaX, deltaY): enregistre le deplacement cumulatif
// - getDirection(): retourne la direction du swipe :
//   - 'left' si deltaX < -threshold
//   - 'right' si deltaX > threshold
//   - 'up' si deltaY < -threshold
//   - 'down' si deltaY > threshold
//   - 'none' si aucun seuil atteint
//   Si les deux axes depassent le seuil, la direction dominante
//   (plus grand deplacement absolu) gagne.
// - reset(): remet les deltas a zero

interface SwipeDetector {
  onPan(deltaX: number, deltaY: number): void;
  getDirection(): SwipeDirection;
  reset(): void;
}

function createSwipeDetector(threshold: number): SwipeDetector {
  // TODO: Implementer cette fonction
  throw new Error('Non implemente');
}

runner.test('createSwipeDetector — aucun mouvement = none', () => {
  const sd = createSwipeDetector(50);
  assertEqual(sd.getDirection(), 'none');
});

runner.test('createSwipeDetector — swipe right', () => {
  const sd = createSwipeDetector(50);
  sd.onPan(60, 10);
  assertEqual(sd.getDirection(), 'right');
});

runner.test('createSwipeDetector — swipe left', () => {
  const sd = createSwipeDetector(50);
  sd.onPan(-80, 20);
  assertEqual(sd.getDirection(), 'left');
});

runner.test('createSwipeDetector — swipe down', () => {
  const sd = createSwipeDetector(50);
  sd.onPan(10, 100);
  assertEqual(sd.getDirection(), 'down');
});

runner.test('createSwipeDetector — swipe up', () => {
  const sd = createSwipeDetector(50);
  sd.onPan(-10, -70);
  assertEqual(sd.getDirection(), 'up');
});

runner.test('createSwipeDetector — direction dominante quand les deux axes depassent', () => {
  const sd = createSwipeDetector(50);
  sd.onPan(100, -60);
  // |100| > |-60| → right
  assertEqual(sd.getDirection(), 'right');
});

runner.test('createSwipeDetector — reset remet a none', () => {
  const sd = createSwipeDetector(50);
  sd.onPan(200, 0);
  assertEqual(sd.getDirection(), 'right');
  sd.reset();
  assertEqual(sd.getDirection(), 'none');
});

// ============================================================================
// Exercice 5 : interpolateValue
// ============================================================================
// Reproduit la fonction interpolate de Reanimated.
// Mappe une valeur d'une plage d'entree vers une plage de sortie.
// - inputRange et outputRange ont la meme longueur (>= 2)
// - inputRange est trie en ordre croissant
// - L'interpolation est lineaire entre chaque segment
// - Clamping : si la valeur est hors de la plage d'entree,
//   retourner la borne de sortie correspondante
//
// Exemple : interpolateValue(150, [0, 100, 200], [0, 50, 100]) → 75
//   (150 est entre 100 et 200, a 50%, sortie = 50 + 0.5 * (100-50) = 75)

function interpolateValue(
  value: number,
  inputRange: number[],
  outputRange: number[],
): number {
  // TODO: Implementer cette fonction
  throw new Error('Non implemente');
}

runner.test('interpolateValue — valeur au debut de la plage', () => {
  assertEqual(interpolateValue(0, [0, 100], [0, 200]), 0);
});

runner.test('interpolateValue — valeur a la fin de la plage', () => {
  assertEqual(interpolateValue(100, [0, 100], [0, 200]), 200);
});

runner.test('interpolateValue — valeur au milieu', () => {
  assertEqual(interpolateValue(50, [0, 100], [0, 200]), 100);
});

runner.test('interpolateValue — clamping en dessous', () => {
  assertEqual(interpolateValue(-50, [0, 100], [0, 200]), 0);
});

runner.test('interpolateValue — clamping au-dessus', () => {
  assertEqual(interpolateValue(150, [0, 100], [0, 200]), 200);
});

runner.test('interpolateValue — plage a 3 segments', () => {
  // 150 est entre 100 et 200, a 50% → sortie = 50 + 0.5*(100-50) = 75
  assertEqual(interpolateValue(150, [0, 100, 200], [0, 50, 100]), 75);
});

runner.test('interpolateValue — interpolation inverse (sortie decroissante)', () => {
  // 50 est a 50% de [0,100] → sortie = 1 + 0.5*(0-1) = 0.5
  assertEqual(interpolateValue(50, [0, 100], [1, 0]), 0.5);
});

// ============================================================================
// Exercice 6 : createDragBounds
// ============================================================================
// Calcule les bornes de deplacement d'un element draggable a l'interieur
// d'un conteneur. L'element est centre par defaut.
// Parametres : containerWidth, containerHeight, itemWidth, itemHeight
// Retourne : { minX, maxX, minY, maxY }
// Calcul :
//   - maxX = (containerWidth - itemWidth) / 2
//   - minX = -maxX
//   - maxY = (containerHeight - itemHeight) / 2
//   - minY = -maxY
// Si l'item est plus grand que le conteneur, min et max sont inverses
// (on peut quand meme scroller).

function createDragBounds(
  containerWidth: number,
  containerHeight: number,
  itemWidth: number,
  itemHeight: number,
): DragBounds {
  // TODO: Implementer cette fonction
  throw new Error('Non implemente');
}

runner.test('createDragBounds — item plus petit que le conteneur', () => {
  const bounds = createDragBounds(400, 600, 100, 100);
  assertEqual(bounds.maxX, 150);
  assertEqual(bounds.minX, -150);
  assertEqual(bounds.maxY, 250);
  assertEqual(bounds.minY, -250);
});

runner.test('createDragBounds — item de meme taille que le conteneur', () => {
  const bounds = createDragBounds(300, 300, 300, 300);
  assertEqual(bounds.maxX, 0);
  assertEqual(bounds.minX, 0);
  assertEqual(bounds.maxY, 0);
  assertEqual(bounds.minY, 0);
});

runner.test('createDragBounds — item plus grand (zoom)', () => {
  const bounds = createDragBounds(300, 300, 600, 600);
  // (300-600)/2 = -150 → maxX = -150, minX = 150
  assertEqual(bounds.maxX, -150);
  assertEqual(bounds.minX, 150);
  assertEqual(bounds.maxY, -150);
  assertEqual(bounds.minY, 150);
});

// ============================================================================
// Exercice 7 : createAnimationTimeline
// ============================================================================
// Cree une timeline d'animation basee sur des keyframes.
// Chaque keyframe a un `progress` (0 a 1) et une `value`.
// Les keyframes sont tries par progress croissant.
// getValueAtProgress(p) interpole lineairement entre les keyframes.
// Si p est avant le premier keyframe ou apres le dernier, clamper
// a la valeur du keyframe le plus proche.

interface AnimationTimeline {
  getValueAtProgress(progress: number): number;
}

function createAnimationTimeline(keyframes: AnimationKeyframe[]): AnimationTimeline {
  // TODO: Implementer cette fonction
  throw new Error('Non implemente');
}

runner.test('createAnimationTimeline — valeur au debut', () => {
  const tl = createAnimationTimeline([
    { progress: 0, value: 0 },
    { progress: 1, value: 100 },
  ]);
  assertEqual(tl.getValueAtProgress(0), 0);
});

runner.test('createAnimationTimeline — valeur a la fin', () => {
  const tl = createAnimationTimeline([
    { progress: 0, value: 0 },
    { progress: 1, value: 100 },
  ]);
  assertEqual(tl.getValueAtProgress(1), 100);
});

runner.test('createAnimationTimeline — interpolation a 50%', () => {
  const tl = createAnimationTimeline([
    { progress: 0, value: 0 },
    { progress: 1, value: 100 },
  ]);
  assertEqual(tl.getValueAtProgress(0.5), 50);
});

runner.test('createAnimationTimeline — clamping avant le premier keyframe', () => {
  const tl = createAnimationTimeline([
    { progress: 0.2, value: 10 },
    { progress: 0.8, value: 90 },
  ]);
  assertEqual(tl.getValueAtProgress(0), 10);
});

runner.test('createAnimationTimeline — clamping apres le dernier keyframe', () => {
  const tl = createAnimationTimeline([
    { progress: 0.2, value: 10 },
    { progress: 0.8, value: 90 },
  ]);
  assertEqual(tl.getValueAtProgress(1), 90);
});

runner.test('createAnimationTimeline — multi-keyframes', () => {
  const tl = createAnimationTimeline([
    { progress: 0, value: 0 },
    { progress: 0.25, value: 100 },
    { progress: 0.75, value: 50 },
    { progress: 1, value: 200 },
  ]);
  // A 0.25 → 100
  assertEqual(tl.getValueAtProgress(0.25), 100);
  // A 0.5 → milieu entre 100 et 50 = 75
  assertEqual(tl.getValueAtProgress(0.5), 75);
  // A 0.75 → 50
  assertEqual(tl.getValueAtProgress(0.75), 50);
});

// ============================================================================
// Lancer les tests
// ============================================================================

runner.run();
