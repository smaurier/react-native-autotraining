// =============================================================================
// Lab 17 — Animated API et LayoutAnimation (Exercices)
// =============================================================================

import {
  createTestRunner,
  assertEqual,
  assertDeepEqual,
  assertTrue,
  assertFalse,
  assertApprox,
  assertGreaterThan,
  assertLessThan,
} from '../test-utils.ts';

// =============================================================================
// Types
// =============================================================================

interface AnimatedValue {
  getValue: () => number;
  setValue: (value: number) => void;
  interpolate: (config: InterpolateConfig) => (input: number) => number;
}

interface InterpolateConfig {
  inputRange: number[];
  outputRange: number[];
  extrapolate?: 'extend' | 'clamp' | 'identity';
}

interface TimingAnimation {
  getValueAtTime: (timeMs: number) => number;
  getDuration: () => number;
  isFinished: (timeMs: number) => boolean;
}

interface SpringAnimation {
  step: (dt: number) => number;
  isAtRest: () => boolean;
  getValue: () => number;
  reset: () => void;
}

interface AnimationSequence {
  play: () => void;
  getValueAtTime: (timeMs: number) => number;
  getTotalDuration: () => number;
}

type EasingFunction = (t: number) => number;

// =============================================================================
// Exercice 1 : createAnimatedValue
// Cree une valeur animee avec :
// - getValue(): retourne la valeur actuelle
// - setValue(v): definit la valeur
// - interpolate(config): retourne une FONCTION qui, pour une valeur d'entree,
//   retourne la valeur interpolee.
//   L'interpolation est lineaire entre les segments definis par inputRange/outputRange.
//   - inputRange et outputRange doivent avoir la meme longueur (sinon erreur).
//   - inputRange doit avoir au moins 2 elements (sinon erreur).
//   - extrapolate 'clamp' : la sortie est bornee par les extremes de outputRange.
//   - extrapolate 'extend' (defaut) : la sortie continue lineairement au-dela.
//   - extrapolate 'identity' : retourne l'entree telle quelle hors des bornes.
// =============================================================================

function createAnimatedValue(_initial: number): AnimatedValue {
  // TODO: implementez la valeur animee
  throw new Error('Not implemented');
}

// =============================================================================
// Exercice 2 : createTimingAnimation
// Cree une animation timing qui va de `from` a `to` sur `duration` ms.
// - getValueAtTime(t): retourne la valeur a l'instant t en utilisant la fonction
//   d'easing fournie. t est en ms. Si t <= 0, retourne from. Si t >= duration, retourne to.
//   Sinon : progress = easing(t / duration), value = from + (to - from) * progress
// - getDuration(): retourne la duree
// - isFinished(t): retourne true si t >= duration
// L'easing par defaut est lineaire (identity).
// =============================================================================

function createTimingAnimation(
  _from: number,
  _to: number,
  _duration: number,
  _easing?: EasingFunction,
): TimingAnimation {
  // TODO: implementez l'animation timing
  throw new Error('Not implemented');
}

// =============================================================================
// Exercice 3 : createSpringAnimation
// Simule une animation spring simplifiee.
// Parametres : from, to, tension, friction.
// Etat interne : position (commence a from), velocity (commence a 0).
// - step(dt): avance la simulation de dt secondes.
//   Force du ressort : F = -tension * (position - to)
//   Force de friction : F = -friction * velocity
//   Acceleration : a = springForce + frictionForce (masse = 1)
//   velocity += a * dt
//   position += velocity * dt
//   Retourne la nouvelle position.
// - isAtRest(): retourne true si |velocity| < 0.001 ET |position - to| < 0.001
// - getValue(): retourne la position actuelle
// - reset(): remet position a from et velocity a 0
// =============================================================================

function createSpringAnimation(
  _from: number,
  _to: number,
  _tension: number,
  _friction: number,
): SpringAnimation {
  // TODO: implementez l'animation spring
  throw new Error('Not implemented');
}

// =============================================================================
// Exercice 4 : staggerDelay
// Calcule le delai de debut d'animation pour un element dans une liste staggeree.
// delay = index * baseDelay
// Si index < 0, lancer une erreur.
// Si baseDelay < 0, lancer une erreur.
// =============================================================================

function staggerDelay(_index: number, _baseDelay: number): number {
  // TODO: calculez le delai
  throw new Error('Not implemented');
}

// =============================================================================
// Exercice 5 : createAnimationSequence
// Cree une sequence d'animations timing.
// Chaque animation est definie par { from, to, duration }.
// Les animations s'executent l'une apres l'autre.
// - play(): ne fait rien (la sequence est implicitement "jouee" par getValueAtTime)
// - getValueAtTime(t): retourne la valeur de la sequence a l'instant t.
//   Si t < 0, retourne la valeur from de la premiere animation.
//   Si t >= totalDuration, retourne la valeur to de la derniere animation.
//   Sinon, trouve quelle animation est en cours et retourne sa valeur (lineaire).
// - getTotalDuration(): retourne la somme de toutes les durees.
// =============================================================================

interface SequenceStep {
  from: number;
  to: number;
  duration: number;
}

function createAnimationSequence(_steps: SequenceStep[]): AnimationSequence {
  // TODO: implementez la sequence d'animations
  throw new Error('Not implemented');
}

// =============================================================================
// Exercice 6 : easingFunctions
// Implementez les fonctions d'easing suivantes.
// Chaque fonction prend t (entre 0 et 1) et retourne un nombre.
// - linear(t) = t
// - easeIn(t) = t^2
// - easeOut(t) = 1 - (1 - t)^2
// - easeInOut(t) = t < 0.5 ? 2*t^2 : 1 - (-2*t + 2)^2 / 2
// - bounce(t) : simulation de rebond
//   si t < 1/2.75 : 7.5625 * t * t
//   si t < 2/2.75 : 7.5625 * (t - 1.5/2.75)^2 + 0.75
//   si t < 2.5/2.75 : 7.5625 * (t - 2.25/2.75)^2 + 0.9375
//   sinon : 7.5625 * (t - 2.625/2.75)^2 + 0.984375
// =============================================================================

function createEasingFunctions(): {
  linear: EasingFunction;
  easeIn: EasingFunction;
  easeOut: EasingFunction;
  easeInOut: EasingFunction;
  bounce: EasingFunction;
} {
  // TODO: implementez les fonctions d'easing
  throw new Error('Not implemented');
}

// =============================================================================
// Tests
// =============================================================================

const runner = createTestRunner('Lab 17 — Animated API et LayoutAnimation');

// --- createAnimatedValue ---

runner.test('animatedValue: getValue retourne la valeur initiale', () => {
  const anim = createAnimatedValue(42);
  assertEqual(anim.getValue(), 42);
});

runner.test('animatedValue: setValue change la valeur', () => {
  const anim = createAnimatedValue(0);
  anim.setValue(100);
  assertEqual(anim.getValue(), 100);
});

runner.test('animatedValue: interpolate lineaire simple', () => {
  const anim = createAnimatedValue(0);
  const interp = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 100],
  });
  assertApprox(interp(0), 0);
  assertApprox(interp(0.5), 50);
  assertApprox(interp(1), 100);
});

runner.test('animatedValue: interpolate multi-segments', () => {
  const anim = createAnimatedValue(0);
  const interp = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 100, 50],
  });
  assertApprox(interp(0), 0);
  assertApprox(interp(0.25), 50);
  assertApprox(interp(0.5), 100);
  assertApprox(interp(0.75), 75);
  assertApprox(interp(1), 50);
});

runner.test('animatedValue: interpolate clamp', () => {
  const anim = createAnimatedValue(0);
  const interp = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 100],
    extrapolate: 'clamp',
  });
  assertApprox(interp(-0.5), 0);   // Borne inferieure
  assertApprox(interp(1.5), 100);  // Borne superieure
});

runner.test('animatedValue: interpolate extend (defaut)', () => {
  const anim = createAnimatedValue(0);
  const interp = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 100],
  });
  assertApprox(interp(1.5), 150);  // Continue lineairement
  assertApprox(interp(-0.5), -50);
});

runner.test('animatedValue: interpolate identity', () => {
  const anim = createAnimatedValue(0);
  const interp = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 100],
    extrapolate: 'identity',
  });
  assertApprox(interp(0.5), 50);   // Dans la plage : normal
  assertApprox(interp(1.5), 1.5);  // Hors plage : retourne l'entree
  assertApprox(interp(-0.5), -0.5);
});

runner.test('animatedValue: interpolate ranges differentes erreur', () => {
  const anim = createAnimatedValue(0);
  let threw = false;
  try {
    anim.interpolate({ inputRange: [0, 1], outputRange: [0, 50, 100] });
  } catch {
    threw = true;
  }
  assertTrue(threw, 'Devrait lancer une erreur si ranges de tailles differentes');
});

// --- createTimingAnimation ---

runner.test('timing: valeur a t=0 est from', () => {
  const anim = createTimingAnimation(0, 100, 1000);
  assertApprox(anim.getValueAtTime(0), 0);
});

runner.test('timing: valeur a t=duration est to', () => {
  const anim = createTimingAnimation(0, 100, 1000);
  assertApprox(anim.getValueAtTime(1000), 100);
});

runner.test('timing: valeur lineaire a mi-chemin', () => {
  const anim = createTimingAnimation(0, 100, 1000);
  assertApprox(anim.getValueAtTime(500), 50);
});

runner.test('timing: easing quadratique', () => {
  const easeIn = (t: number) => t * t;
  const anim = createTimingAnimation(0, 100, 1000, easeIn);
  // A t=500, progress = 0.5, easeIn(0.5) = 0.25, value = 25
  assertApprox(anim.getValueAtTime(500), 25);
});

runner.test('timing: isFinished', () => {
  const anim = createTimingAnimation(0, 100, 300);
  assertFalse(anim.isFinished(299));
  assertTrue(anim.isFinished(300));
  assertTrue(anim.isFinished(1000));
});

runner.test('timing: getDuration', () => {
  const anim = createTimingAnimation(0, 100, 750);
  assertEqual(anim.getDuration(), 750);
});

// --- createSpringAnimation ---

runner.test('spring: valeur initiale est from', () => {
  const spring = createSpringAnimation(0, 100, 40, 7);
  assertApprox(spring.getValue(), 0);
});

runner.test('spring: converge vers to', () => {
  const spring = createSpringAnimation(0, 100, 40, 10);
  // Simuler 200 pas de 16ms (3.2 secondes)
  for (let i = 0; i < 200; i++) {
    spring.step(0.016);
  }
  assertApprox(spring.getValue(), 100, 1); // Proche de 100
  assertTrue(spring.isAtRest(), 'Le ressort devrait etre au repos');
});

runner.test('spring: reset remet a la position initiale', () => {
  const spring = createSpringAnimation(10, 50, 40, 7);
  spring.step(0.1);
  spring.reset();
  assertApprox(spring.getValue(), 10);
});

runner.test('spring: haute tension = oscillations plus rapides', () => {
  const softSpring = createSpringAnimation(0, 100, 20, 5);
  const stiffSpring = createSpringAnimation(0, 100, 100, 5);
  // Apres un pas, le ressort raide se deplace plus
  softSpring.step(0.016);
  stiffSpring.step(0.016);
  assertTrue(
    Math.abs(stiffSpring.getValue()) > Math.abs(softSpring.getValue()),
    'Le ressort raide devrait se deplacer plus vite',
  );
});

// --- staggerDelay ---

runner.test('stagger: index 0 = delai 0', () => {
  assertEqual(staggerDelay(0, 100), 0);
});

runner.test('stagger: index 3, baseDelay 100 = 300', () => {
  assertEqual(staggerDelay(3, 100), 300);
});

runner.test('stagger: index negatif lance une erreur', () => {
  let threw = false;
  try {
    staggerDelay(-1, 100);
  } catch {
    threw = true;
  }
  assertTrue(threw, 'index negatif devrait lancer une erreur');
});

runner.test('stagger: baseDelay negatif lance une erreur', () => {
  let threw = false;
  try {
    staggerDelay(1, -50);
  } catch {
    threw = true;
  }
  assertTrue(threw, 'baseDelay negatif devrait lancer une erreur');
});

// --- createAnimationSequence ---

runner.test('sequence: totalDuration est la somme', () => {
  const seq = createAnimationSequence([
    { from: 0, to: 100, duration: 300 },
    { from: 100, to: 50, duration: 200 },
  ]);
  assertEqual(seq.getTotalDuration(), 500);
});

runner.test('sequence: valeur au debut', () => {
  const seq = createAnimationSequence([
    { from: 0, to: 100, duration: 300 },
    { from: 100, to: 50, duration: 200 },
  ]);
  assertApprox(seq.getValueAtTime(0), 0);
});

runner.test('sequence: valeur a la fin', () => {
  const seq = createAnimationSequence([
    { from: 0, to: 100, duration: 300 },
    { from: 100, to: 50, duration: 200 },
  ]);
  assertApprox(seq.getValueAtTime(500), 50);
});

runner.test('sequence: valeur pendant la premiere animation', () => {
  const seq = createAnimationSequence([
    { from: 0, to: 100, duration: 200 },
    { from: 100, to: 0, duration: 200 },
  ]);
  // A t=100, moitie de la premiere animation : 50
  assertApprox(seq.getValueAtTime(100), 50);
});

runner.test('sequence: valeur pendant la deuxieme animation', () => {
  const seq = createAnimationSequence([
    { from: 0, to: 100, duration: 200 },
    { from: 100, to: 0, duration: 200 },
  ]);
  // A t=300, moitie de la deuxieme animation : 50
  assertApprox(seq.getValueAtTime(300), 50);
});

runner.test('sequence: valeur apres la fin retourne le dernier to', () => {
  const seq = createAnimationSequence([
    { from: 0, to: 100, duration: 200 },
  ]);
  assertApprox(seq.getValueAtTime(500), 100);
});

// --- easingFunctions ---

runner.test('easing: linear', () => {
  const { linear } = createEasingFunctions();
  assertApprox(linear(0), 0);
  assertApprox(linear(0.5), 0.5);
  assertApprox(linear(1), 1);
});

runner.test('easing: easeIn (quadratique)', () => {
  const { easeIn } = createEasingFunctions();
  assertApprox(easeIn(0), 0);
  assertApprox(easeIn(0.5), 0.25);
  assertApprox(easeIn(1), 1);
});

runner.test('easing: easeOut', () => {
  const { easeOut } = createEasingFunctions();
  assertApprox(easeOut(0), 0);
  assertApprox(easeOut(0.5), 0.75);
  assertApprox(easeOut(1), 1);
});

runner.test('easing: easeInOut symetrique', () => {
  const { easeInOut } = createEasingFunctions();
  assertApprox(easeInOut(0), 0);
  assertApprox(easeInOut(0.5), 0.5);
  assertApprox(easeInOut(1), 1);
  // Premiere moitie plus lente que lineaire
  assertLessThan(easeInOut(0.25), 0.25);
  // Deuxieme moitie plus rapide
  assertGreaterThan(easeInOut(0.75), 0.75);
});

runner.test('easing: bounce atteint 1 a t=1', () => {
  const { bounce } = createEasingFunctions();
  assertApprox(bounce(0), 0);
  assertApprox(bounce(1), 1, 0.01);
});

runner.test('easing: bounce premiere phase quadratique', () => {
  const { bounce } = createEasingFunctions();
  // t = 0.2 < 1/2.75 ≈ 0.3636
  // result = 7.5625 * 0.2 * 0.2 = 0.3025
  assertApprox(bounce(0.2), 7.5625 * 0.04, 0.01);
});

runner.run();
