// ============================================================================
// LAB 18 — Reanimated & Gesture Handler (logique pure) — SOLUTIONS
// ============================================================================
// Lancez avec : npx tsx labs/lab-18-reanimated-gestures/solution.ts
// ============================================================================

import {
  createTestRunner,
  assertEqual,
  assertDeepEqual,
  assertTrue,
  assertFalse,
  assertThrows,
} from '../test-utils.ts';

const runner = createTestRunner('Lab 18 — Reanimated & Gesture Handler (Solutions)');

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
  progress: number;
  value: number;
}

// ============================================================================
// Exercice 1 : createSharedValue
// ============================================================================

function createSharedValue<T>(initial: T): SharedValue<T> {
  return { value: initial };
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

function clampValue(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
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

interface GestureStateManager {
  getState(): GestureState;
  begin(): void;
  update(x: number, y: number, velocityX: number, velocityY: number): void;
  end(): void;
  reset(): void;
}

function createGestureState(): GestureStateManager {
  let state: GestureState = {
    active: false,
    x: 0,
    y: 0,
    velocityX: 0,
    velocityY: 0,
  };

  return {
    getState() {
      return { ...state };
    },
    begin() {
      state.active = true;
    },
    update(x: number, y: number, velocityX: number, velocityY: number) {
      state.x = x;
      state.y = y;
      state.velocityX = velocityX;
      state.velocityY = velocityY;
    },
    end() {
      state.active = false;
    },
    reset() {
      state = {
        active: false,
        x: 0,
        y: 0,
        velocityX: 0,
        velocityY: 0,
      };
    },
  };
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

interface SwipeDetector {
  onPan(deltaX: number, deltaY: number): void;
  getDirection(): SwipeDirection;
  reset(): void;
}

function createSwipeDetector(threshold: number): SwipeDetector {
  let deltaX = 0;
  let deltaY = 0;

  return {
    onPan(dx: number, dy: number) {
      deltaX = dx;
      deltaY = dy;
    },
    getDirection(): SwipeDirection {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Aucun seuil atteint
      if (absX < threshold && absY < threshold) {
        return 'none';
      }

      // Direction dominante
      if (absX >= absY) {
        return deltaX > 0 ? 'right' : 'left';
      } else {
        return deltaY > 0 ? 'down' : 'up';
      }
    },
    reset() {
      deltaX = 0;
      deltaY = 0;
    },
  };
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

function interpolateValue(
  value: number,
  inputRange: number[],
  outputRange: number[],
): number {
  // Clamping en dessous
  if (value <= inputRange[0]) {
    return outputRange[0];
  }
  // Clamping au-dessus
  if (value >= inputRange[inputRange.length - 1]) {
    return outputRange[outputRange.length - 1];
  }

  // Trouver le segment
  for (let i = 0; i < inputRange.length - 1; i++) {
    if (value >= inputRange[i] && value <= inputRange[i + 1]) {
      const inputStart = inputRange[i];
      const inputEnd = inputRange[i + 1];
      const outputStart = outputRange[i];
      const outputEnd = outputRange[i + 1];

      const ratio = (value - inputStart) / (inputEnd - inputStart);
      return outputStart + ratio * (outputEnd - outputStart);
    }
  }

  return outputRange[outputRange.length - 1];
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
  assertEqual(interpolateValue(150, [0, 100, 200], [0, 50, 100]), 75);
});

runner.test('interpolateValue — interpolation inverse (sortie decroissante)', () => {
  assertEqual(interpolateValue(50, [0, 100], [1, 0]), 0.5);
});

// ============================================================================
// Exercice 6 : createDragBounds
// ============================================================================

function createDragBounds(
  containerWidth: number,
  containerHeight: number,
  itemWidth: number,
  itemHeight: number,
): DragBounds {
  const maxX = (containerWidth - itemWidth) / 2;
  const minX = -maxX;
  const maxY = (containerHeight - itemHeight) / 2;
  const minY = -maxY;

  return { minX, maxX, minY, maxY };
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
  assertEqual(bounds.maxX, -150);
  assertEqual(bounds.minX, 150);
  assertEqual(bounds.maxY, -150);
  assertEqual(bounds.minY, 150);
});

// ============================================================================
// Exercice 7 : createAnimationTimeline
// ============================================================================

interface AnimationTimeline {
  getValueAtProgress(progress: number): number;
}

function createAnimationTimeline(keyframes: AnimationKeyframe[]): AnimationTimeline {
  // Trier par progress croissant
  const sorted = [...keyframes].sort((a, b) => a.progress - b.progress);

  return {
    getValueAtProgress(progress: number): number {
      // Clamping avant le premier keyframe
      if (progress <= sorted[0].progress) {
        return sorted[0].value;
      }
      // Clamping apres le dernier keyframe
      if (progress >= sorted[sorted.length - 1].progress) {
        return sorted[sorted.length - 1].value;
      }

      // Trouver le segment
      for (let i = 0; i < sorted.length - 1; i++) {
        if (progress >= sorted[i].progress && progress <= sorted[i + 1].progress) {
          const pStart = sorted[i].progress;
          const pEnd = sorted[i + 1].progress;
          const vStart = sorted[i].value;
          const vEnd = sorted[i + 1].value;

          const ratio = (progress - pStart) / (pEnd - pStart);
          return vStart + ratio * (vEnd - vStart);
        }
      }

      return sorted[sorted.length - 1].value;
    },
  };
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
  assertEqual(tl.getValueAtProgress(0.25), 100);
  assertEqual(tl.getValueAtProgress(0.5), 75);
  assertEqual(tl.getValueAtProgress(0.75), 50);
});

// ============================================================================
// Lancer les tests
// ============================================================================

runner.run();
