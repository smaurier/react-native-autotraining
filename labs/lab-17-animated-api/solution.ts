// =============================================================================
// Lab 17 — Animated API et LayoutAnimation (Solutions)
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

interface SequenceStep {
  from: number;
  to: number;
  duration: number;
}

// =============================================================================
// Exercice 1 : createAnimatedValue
// =============================================================================

function createAnimatedValue(initial: number): AnimatedValue {
  let value = initial;

  return {
    getValue(): number {
      return value;
    },

    setValue(v: number): void {
      value = v;
    },

    interpolate(config: InterpolateConfig): (input: number) => number {
      const { inputRange, outputRange, extrapolate = 'extend' } = config;

      if (inputRange.length !== outputRange.length) {
        throw new Error('inputRange and outputRange must have the same length');
      }
      if (inputRange.length < 2) {
        throw new Error('inputRange must have at least 2 elements');
      }

      return (input: number): number => {
        // Trouver le segment
        if (input <= inputRange[0]) {
          if (extrapolate === 'clamp') return outputRange[0];
          if (extrapolate === 'identity') return input;
          // extend : extrapoler depuis le premier segment
          const slope =
            (outputRange[1] - outputRange[0]) /
            (inputRange[1] - inputRange[0]);
          return outputRange[0] + slope * (input - inputRange[0]);
        }

        if (input >= inputRange[inputRange.length - 1]) {
          if (extrapolate === 'clamp') return outputRange[outputRange.length - 1];
          if (extrapolate === 'identity') return input;
          // extend
          const last = inputRange.length - 1;
          const slope =
            (outputRange[last] - outputRange[last - 1]) /
            (inputRange[last] - inputRange[last - 1]);
          return outputRange[last] + slope * (input - inputRange[last]);
        }

        // Trouver le segment actif
        for (let i = 1; i < inputRange.length; i++) {
          if (input <= inputRange[i]) {
            const t =
              (input - inputRange[i - 1]) /
              (inputRange[i] - inputRange[i - 1]);
            return outputRange[i - 1] + t * (outputRange[i] - outputRange[i - 1]);
          }
        }

        return outputRange[outputRange.length - 1];
      };
    },
  };
}

// =============================================================================
// Exercice 2 : createTimingAnimation
// =============================================================================

function createTimingAnimation(
  from: number,
  to: number,
  duration: number,
  easing: EasingFunction = (t) => t,
): TimingAnimation {
  return {
    getValueAtTime(timeMs: number): number {
      if (timeMs <= 0) return from;
      if (timeMs >= duration) return to;
      const progress = easing(timeMs / duration);
      return from + (to - from) * progress;
    },

    getDuration(): number {
      return duration;
    },

    isFinished(timeMs: number): boolean {
      return timeMs >= duration;
    },
  };
}

// =============================================================================
// Exercice 3 : createSpringAnimation
// =============================================================================

function createSpringAnimation(
  from: number,
  to: number,
  tension: number,
  friction: number,
): SpringAnimation {
  let position = from;
  let velocity = 0;

  return {
    step(dt: number): number {
      const springForce = -tension * (position - to);
      const frictionForce = -friction * velocity;
      const acceleration = springForce + frictionForce;
      velocity += acceleration * dt;
      position += velocity * dt;
      return position;
    },

    isAtRest(): boolean {
      return Math.abs(velocity) < 0.001 && Math.abs(position - to) < 0.001;
    },

    getValue(): number {
      return position;
    },

    reset(): void {
      position = from;
      velocity = 0;
    },
  };
}

// =============================================================================
// Exercice 4 : staggerDelay
// =============================================================================

function staggerDelay(index: number, baseDelay: number): number {
  if (index < 0) throw new Error('index must not be negative');
  if (baseDelay < 0) throw new Error('baseDelay must not be negative');
  return index * baseDelay;
}

// =============================================================================
// Exercice 5 : createAnimationSequence
// =============================================================================

function createAnimationSequence(steps: SequenceStep[]): AnimationSequence {
  const totalDuration = steps.reduce((sum, s) => sum + s.duration, 0);

  return {
    play(): void {
      // No-op — la sequence est implicitement "jouee" par getValueAtTime
    },

    getValueAtTime(timeMs: number): number {
      if (steps.length === 0) return 0;
      if (timeMs < 0) return steps[0].from;
      if (timeMs >= totalDuration) return steps[steps.length - 1].to;

      let elapsed = 0;
      for (const step of steps) {
        if (timeMs < elapsed + step.duration) {
          const localT = (timeMs - elapsed) / step.duration;
          return step.from + (step.to - step.from) * localT;
        }
        elapsed += step.duration;
      }

      return steps[steps.length - 1].to;
    },

    getTotalDuration(): number {
      return totalDuration;
    },
  };
}

// =============================================================================
// Exercice 6 : easingFunctions
// =============================================================================

function createEasingFunctions(): {
  linear: EasingFunction;
  easeIn: EasingFunction;
  easeOut: EasingFunction;
  easeInOut: EasingFunction;
  bounce: EasingFunction;
} {
  return {
    linear(t: number): number {
      return t;
    },

    easeIn(t: number): number {
      return t * t;
    },

    easeOut(t: number): number {
      return 1 - (1 - t) ** 2;
    },

    easeInOut(t: number): number {
      if (t < 0.5) {
        return 2 * t * t;
      }
      return 1 - (-2 * t + 2) ** 2 / 2;
    },

    bounce(t: number): number {
      const n1 = 7.5625;
      const d1 = 2.75;

      if (t < 1 / d1) {
        return n1 * t * t;
      } else if (t < 2 / d1) {
        const adj = t - 1.5 / d1;
        return n1 * adj * adj + 0.75;
      } else if (t < 2.5 / d1) {
        const adj = t - 2.25 / d1;
        return n1 * adj * adj + 0.9375;
      } else {
        const adj = t - 2.625 / d1;
        return n1 * adj * adj + 0.984375;
      }
    },
  };
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
  assertApprox(interp(-0.5), 0);
  assertApprox(interp(1.5), 100);
});

runner.test('animatedValue: interpolate extend (defaut)', () => {
  const anim = createAnimatedValue(0);
  const interp = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 100],
  });
  assertApprox(interp(1.5), 150);
  assertApprox(interp(-0.5), -50);
});

runner.test('animatedValue: interpolate identity', () => {
  const anim = createAnimatedValue(0);
  const interp = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 100],
    extrapolate: 'identity',
  });
  assertApprox(interp(0.5), 50);
  assertApprox(interp(1.5), 1.5);
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
  for (let i = 0; i < 200; i++) {
    spring.step(0.016);
  }
  assertApprox(spring.getValue(), 100, 1);
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
  assertApprox(seq.getValueAtTime(100), 50);
});

runner.test('sequence: valeur pendant la deuxieme animation', () => {
  const seq = createAnimationSequence([
    { from: 0, to: 100, duration: 200 },
    { from: 100, to: 0, duration: 200 },
  ]);
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
  assertLessThan(easeInOut(0.25), 0.25);
  assertGreaterThan(easeInOut(0.75), 0.75);
});

runner.test('easing: bounce atteint 1 a t=1', () => {
  const { bounce } = createEasingFunctions();
  assertApprox(bounce(0), 0);
  assertApprox(bounce(1), 1, 0.01);
});

runner.test('easing: bounce premiere phase quadratique', () => {
  const { bounce } = createEasingFunctions();
  assertApprox(bounce(0.2), 7.5625 * 0.04, 0.01);
});

runner.run();
