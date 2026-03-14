// =============================================================================
// Lab 16 — Capteurs et notifications (Solutions)
// =============================================================================

import {
  createTestRunner,
  assertEqual,
  assertDeepEqual,
  assertTrue,
  assertFalse,
  assertApprox,
  assertGreaterThan,
  assertNotNull,
} from '../test-utils.ts';

// =============================================================================
// Types
// =============================================================================

interface Vector3D {
  x: number;
  y: number;
  z: number;
}

interface StepDetectorResult {
  stepDetected: boolean;
  stepCount: number;
}

interface StepDetector {
  processSample: (x: number, y: number, z: number, timestamp: number) => StepDetectorResult;
  getStepCount: () => number;
  reset: () => void;
}

interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  scheduledTime: number;
}

interface NotificationScheduler {
  schedule: (title: string, body: string, delayMs: number) => string;
  cancel: (id: string) => boolean;
  getScheduled: () => ScheduledNotification[];
  cancelAll: () => void;
}

interface FusedOrientation {
  pitch: number;
  roll: number;
}

interface SensorFusion {
  update: (accel: Vector3D, gyro: Vector3D, timestamp: number) => FusedOrientation;
  getOrientation: () => FusedOrientation;
  reset: () => void;
}

// =============================================================================
// Exercice 1 : lowPassFilter
// =============================================================================

function lowPassFilter(
  current: Vector3D,
  previous: Vector3D,
  alpha: number,
): Vector3D {
  if (alpha < 0 || alpha > 1) {
    throw new Error('alpha must be between 0 and 1');
  }
  return {
    x: alpha * current.x + (1 - alpha) * previous.x,
    y: alpha * current.y + (1 - alpha) * previous.y,
    z: alpha * current.z + (1 - alpha) * previous.z,
  };
}

// =============================================================================
// Exercice 2 : movingAverage
// =============================================================================

function movingAverage(readings: number[], windowSize: number): number[] {
  if (windowSize < 1) {
    throw new Error('windowSize must be at least 1');
  }
  if (readings.length === 0) return [];

  return readings.map((_, i) => {
    const start = Math.max(0, i - windowSize + 1);
    const window = readings.slice(start, i + 1);
    const sum = window.reduce((a, b) => a + b, 0);
    return sum / window.length;
  });
}

// =============================================================================
// Exercice 3 : createStepDetector
// =============================================================================

function createStepDetector(threshold: number): StepDetector {
  let stepCount = 0;
  let lastStepTime = -Infinity;
  let rising = false;

  return {
    processSample(x: number, y: number, z: number, timestamp: number): StepDetectorResult {
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      let stepDetected = false;

      if (magnitude > threshold && !rising) {
        rising = true;
      } else if (magnitude <= threshold && rising) {
        rising = false;
        if (timestamp - lastStepTime >= 300) {
          stepCount++;
          lastStepTime = timestamp;
          stepDetected = true;
        }
      }

      return { stepDetected, stepCount };
    },

    getStepCount(): number {
      return stepCount;
    },

    reset(): void {
      stepCount = 0;
      lastStepTime = -Infinity;
      rising = false;
    },
  };
}

// =============================================================================
// Exercice 4 : createNotificationScheduler
// =============================================================================

function createNotificationScheduler(): NotificationScheduler {
  let notifications: ScheduledNotification[] = [];
  let counter = 0;
  let now = 1000;

  return {
    schedule(title: string, body: string, delayMs: number): string {
      counter++;
      const id = `notif-${counter}`;
      const scheduledTime = now + delayMs;
      now++;
      notifications.push({ id, title, body, scheduledTime });
      return id;
    },

    cancel(id: string): boolean {
      const index = notifications.findIndex((n) => n.id === id);
      if (index === -1) return false;
      notifications.splice(index, 1);
      return true;
    },

    getScheduled(): ScheduledNotification[] {
      return [...notifications].sort((a, b) => a.scheduledTime - b.scheduledTime);
    },

    cancelAll(): void {
      notifications = [];
    },
  };
}

// =============================================================================
// Exercice 5 : createSensorFusion
// =============================================================================

function createSensorFusion(alpha = 0.98): SensorFusion {
  let orientation: FusedOrientation = { pitch: 0, roll: 0 };
  let lastTimestamp = 0;
  let isFirstUpdate = true;

  return {
    update(
      accel: Vector3D,
      gyro: Vector3D,
      timestamp: number,
    ): FusedOrientation {
      // Angles depuis l'accelerometre
      const accelPitch = Math.atan2(
        -accel.x,
        Math.sqrt(accel.y ** 2 + accel.z ** 2),
      );
      const accelRoll = Math.atan2(accel.y, accel.z);

      if (isFirstUpdate) {
        // Premier appel : initialiser avec l'accelerometre seul
        isFirstUpdate = false;
        lastTimestamp = timestamp;
        orientation = { pitch: accelPitch, roll: accelRoll };
      } else {
        const dt = (timestamp - lastTimestamp) / 1000;
        lastTimestamp = timestamp;

        // Integration du gyroscope
        const gyroPitch = orientation.pitch + gyro.x * dt;
        const gyroRoll = orientation.roll + gyro.y * dt;

        // Filtre complementaire
        orientation = {
          pitch: alpha * gyroPitch + (1 - alpha) * accelPitch,
          roll: alpha * gyroRoll + (1 - alpha) * accelRoll,
        };
      }

      return { ...orientation };
    },

    getOrientation(): FusedOrientation {
      return { ...orientation };
    },

    reset(): void {
      orientation = { pitch: 0, roll: 0 };
      lastTimestamp = 0;
      isFirstUpdate = true;
    },
  };
}

// =============================================================================
// Tests
// =============================================================================

const runner = createTestRunner('Lab 16 — Capteurs et notifications');

// --- lowPassFilter ---

runner.test('lowPassFilter: alpha=1 retourne current', () => {
  const current = { x: 10, y: 20, z: 30 };
  const previous = { x: 1, y: 2, z: 3 };
  const result = lowPassFilter(current, previous, 1);
  assertApprox(result.x, 10);
  assertApprox(result.y, 20);
  assertApprox(result.z, 30);
});

runner.test('lowPassFilter: alpha=0 retourne previous', () => {
  const current = { x: 10, y: 20, z: 30 };
  const previous = { x: 1, y: 2, z: 3 };
  const result = lowPassFilter(current, previous, 0);
  assertApprox(result.x, 1);
  assertApprox(result.y, 2);
  assertApprox(result.z, 3);
});

runner.test('lowPassFilter: alpha=0.5 retourne la moyenne', () => {
  const current = { x: 10, y: 20, z: 30 };
  const previous = { x: 0, y: 0, z: 0 };
  const result = lowPassFilter(current, previous, 0.5);
  assertApprox(result.x, 5);
  assertApprox(result.y, 10);
  assertApprox(result.z, 15);
});

runner.test('lowPassFilter: alpha invalide lance une erreur', () => {
  let threw = false;
  try {
    lowPassFilter({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, 1.5);
  } catch {
    threw = true;
  }
  assertTrue(threw, 'alpha > 1 devrait lancer une erreur');

  threw = false;
  try {
    lowPassFilter({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, -0.1);
  } catch {
    threw = true;
  }
  assertTrue(threw, 'alpha < 0 devrait lancer une erreur');
});

// --- movingAverage ---

runner.test('movingAverage: fenetre de 3 sur 5 elements', () => {
  const readings = [10, 20, 30, 40, 50];
  const result = movingAverage(readings, 3);
  assertApprox(result[0], 10);
  assertApprox(result[1], 15);
  assertApprox(result[2], 20);
  assertApprox(result[3], 30);
  assertApprox(result[4], 40);
});

runner.test('movingAverage: fenetre de 1 retourne les memes valeurs', () => {
  const readings = [5, 10, 15];
  const result = movingAverage(readings, 1);
  assertApprox(result[0], 5);
  assertApprox(result[1], 10);
  assertApprox(result[2], 15);
});

runner.test('movingAverage: tableau vide retourne tableau vide', () => {
  const result = movingAverage([], 3);
  assertEqual(result.length, 0);
});

runner.test('movingAverage: windowSize < 1 lance une erreur', () => {
  let threw = false;
  try {
    movingAverage([1, 2, 3], 0);
  } catch {
    threw = true;
  }
  assertTrue(threw, 'windowSize < 1 devrait lancer une erreur');
});

// --- createStepDetector ---

runner.test('detectStep: detection d\'un pic au-dessus du seuil', () => {
  const detector = createStepDetector(1.2);
  detector.processSample(0, 0, 1.0, 0);
  detector.processSample(0, 0, 1.3, 100);
  const result = detector.processSample(0, 0, 1.0, 200);
  assertTrue(result.stepDetected, 'Un pas devrait etre detecte');
  assertEqual(result.stepCount, 1);
});

runner.test('detectStep: intervalle minimum entre pas', () => {
  const detector = createStepDetector(1.2);
  detector.processSample(0, 0, 1.0, 0);
  detector.processSample(0, 0, 1.3, 50);
  detector.processSample(0, 0, 1.0, 100);
  detector.processSample(0, 0, 1.3, 150);
  const result = detector.processSample(0, 0, 1.0, 200);
  assertFalse(result.stepDetected, 'Pas trop rapide ne devrait pas etre detecte');
  assertEqual(result.stepCount, 1);
});

runner.test('detectStep: deux pas espaces correctement', () => {
  const detector = createStepDetector(1.2);
  detector.processSample(0, 0, 1.0, 0);
  detector.processSample(0, 0, 1.3, 50);
  detector.processSample(0, 0, 1.0, 100);
  detector.processSample(0, 0, 1.3, 450);
  const result = detector.processSample(0, 0, 1.0, 500);
  assertTrue(result.stepDetected);
  assertEqual(result.stepCount, 2);
});

runner.test('detectStep: reset reinitialise le compteur', () => {
  const detector = createStepDetector(1.2);
  detector.processSample(0, 0, 1.0, 0);
  detector.processSample(0, 0, 1.3, 50);
  detector.processSample(0, 0, 1.0, 100);
  assertEqual(detector.getStepCount(), 1);
  detector.reset();
  assertEqual(detector.getStepCount(), 0);
});

// --- createNotificationScheduler ---

runner.test('scheduler: planifier des notifications', () => {
  const scheduler = createNotificationScheduler();
  const id1 = scheduler.schedule('Titre 1', 'Corps 1', 5000);
  const id2 = scheduler.schedule('Titre 2', 'Corps 2', 3000);
  assertEqual(id1, 'notif-1');
  assertEqual(id2, 'notif-2');
  assertEqual(scheduler.getScheduled().length, 2);
});

runner.test('scheduler: getScheduled trie par scheduledTime', () => {
  const scheduler = createNotificationScheduler();
  scheduler.schedule('Loin', 'Corps', 10000);
  scheduler.schedule('Proche', 'Corps', 1000);
  const scheduled = scheduler.getScheduled();
  assertTrue(
    scheduled[0].scheduledTime < scheduled[1].scheduledTime,
    'Les notifications doivent etre triees par scheduledTime croissant',
  );
  assertEqual(scheduled[0].title, 'Proche');
});

runner.test('scheduler: cancel retourne true si trouvee', () => {
  const scheduler = createNotificationScheduler();
  const id = scheduler.schedule('Test', 'Corps', 5000);
  assertTrue(scheduler.cancel(id));
  assertEqual(scheduler.getScheduled().length, 0);
});

runner.test('scheduler: cancel retourne false si non trouvee', () => {
  const scheduler = createNotificationScheduler();
  assertFalse(scheduler.cancel('notif-999'));
});

runner.test('scheduler: cancelAll vide tout', () => {
  const scheduler = createNotificationScheduler();
  scheduler.schedule('A', 'Corps', 1000);
  scheduler.schedule('B', 'Corps', 2000);
  scheduler.schedule('C', 'Corps', 3000);
  scheduler.cancelAll();
  assertEqual(scheduler.getScheduled().length, 0);
});

// --- createSensorFusion ---

runner.test('sensorFusion: premier appel utilise uniquement accel', () => {
  const fusion = createSensorFusion(0.98);
  const result = fusion.update(
    { x: 0, y: 0, z: 1 },
    { x: 0, y: 0, z: 0 },
    1000,
  );
  assertApprox(result.pitch, 0, 0.01);
  assertApprox(result.roll, 0, 0.01);
});

runner.test('sensorFusion: accel incline donne un pitch non nul', () => {
  const fusion = createSensorFusion(0.98);
  const result = fusion.update(
    { x: -0.5, y: 0, z: 0.866 },
    { x: 0, y: 0, z: 0 },
    1000,
  );
  assertApprox(result.pitch, Math.PI / 6, 0.02);
});

runner.test('sensorFusion: reset reinitialise l\'orientation', () => {
  const fusion = createSensorFusion(0.98);
  fusion.update({ x: -0.5, y: 0, z: 0.866 }, { x: 0, y: 0, z: 0 }, 1000);
  fusion.reset();
  const orientation = fusion.getOrientation();
  assertApprox(orientation.pitch, 0);
  assertApprox(orientation.roll, 0);
});

runner.test('sensorFusion: gyro contribue au deuxieme appel', () => {
  const fusion = createSensorFusion(0.5);
  fusion.update({ x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: 0 }, 1000);
  const result = fusion.update(
    { x: 0, y: 0, z: 1 },
    { x: 1, y: 0, z: 0 },
    1100,
  );
  assertApprox(result.pitch, 0.05, 0.01);
});

runner.run();
