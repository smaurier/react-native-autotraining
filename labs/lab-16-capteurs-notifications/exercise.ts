// =============================================================================
// Lab 16 — Capteurs et notifications (Exercices)
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
// Applique un filtre passe-bas sur un vecteur 3D.
// Formule : result[axis] = alpha * current[axis] + (1 - alpha) * previous[axis]
// pour chaque axe (x, y, z).
// Si alpha < 0 ou alpha > 1, lancer une erreur.
// =============================================================================

function lowPassFilter(
  _current: Vector3D,
  _previous: Vector3D,
  _alpha: number,
): Vector3D {
  // TODO: implementez le filtre passe-bas
  throw new Error('Not implemented');
}

// =============================================================================
// Exercice 2 : movingAverage
// Calcule la moyenne mobile d'un tableau de nombres sur une fenetre de taille windowSize.
// Retourne un tableau de moyennes. Pour chaque position i, la moyenne porte sur
// les elements de max(0, i - windowSize + 1) a i (inclus).
// Si windowSize < 1, lancer une erreur.
// Si readings est vide, retourner un tableau vide.
// =============================================================================

function movingAverage(_readings: number[], _windowSize: number): number[] {
  // TODO: implementez la moyenne mobile
  throw new Error('Not implemented');
}

// =============================================================================
// Exercice 3 : detectStep
// Cree un detecteur de pas basé sur la magnitude de l'acceleration.
// - processSample(x, y, z, timestamp): calcule la magnitude sqrt(x²+y²+z²),
//   detecte un pas quand la magnitude depasse le seuil (montee) puis redescend
//   (descente), avec un intervalle minimum de 300ms entre deux pas.
//   Initialiser lastStepTime a -Infinity pour que le premier pas soit toujours valide.
// - getStepCount(): retourne le nombre total de pas detectes.
// - reset(): remet le compteur a 0 et reinitialise l'etat (lastStepTime a -Infinity).
// =============================================================================

function createStepDetector(_threshold: number): StepDetector {
  // TODO: implementez le detecteur de pas
  throw new Error('Not implemented');
}

// =============================================================================
// Exercice 4 : createNotificationScheduler
// Cree un planificateur de notifications locales.
// - schedule(title, body, delayMs): planifie une notification, retourne un id
//   au format 'notif-{counter}' (counter commence a 1). scheduledTime = now + delayMs.
//   Le "now" est simule : utilisez un compteur interne qui commence a 1000 et
//   s'incremente de 1 a chaque appel a schedule.
// - cancel(id): annule une notification. Retourne true si trouvee, false sinon.
// - getScheduled(): retourne toutes les notifications planifiees, triees par
//   scheduledTime croissant.
// - cancelAll(): annule toutes les notifications.
// =============================================================================

function createNotificationScheduler(): NotificationScheduler {
  // TODO: implementez le planificateur de notifications
  throw new Error('Not implemented');
}

// =============================================================================
// Exercice 5 : createSensorFusion
// Combine accelerometre et gyroscope via un filtre complementaire.
// - update(accel, gyro, timestamp): calcule l'orientation fusionnee.
//   - Pitch depuis accel : atan2(-accel.x, sqrt(accel.y² + accel.z²))
//   - Roll depuis accel : atan2(accel.y, accel.z)
//   - Au PREMIER appel : initialiser l'orientation directement avec les angles accel
//     (pas de filtre complementaire, car le gyro n'a pas de reference precedente).
//   - Aux appels suivants :
//     - dt = (timestamp - lastTimestamp) / 1000
//     - gyroPitch = previousPitch + gyro.x * dt
//     - gyroRoll = previousRoll + gyro.y * dt
//     - fusedPitch = alpha * gyroPitch + (1 - alpha) * accelPitch
//     - fusedRoll = alpha * gyroRoll + (1 - alpha) * accelRoll
//   Retourne { pitch, roll }.
// - getOrientation(): retourne l'orientation actuelle.
// - reset(): reinitialise pitch et roll a 0, lastTimestamp a 0, isFirstUpdate a true.
// alpha par defaut = 0.98
// =============================================================================

function createSensorFusion(_alpha?: number): SensorFusion {
  // TODO: implementez la fusion de capteurs
  throw new Error('Not implemented');
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
  // i=0: avg(10) = 10
  // i=1: avg(10,20) = 15
  // i=2: avg(10,20,30) = 20
  // i=3: avg(20,30,40) = 30
  // i=4: avg(30,40,50) = 40
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
  // Phase montante
  detector.processSample(0, 0, 1.0, 0);    // magnitude 1.0 (sous seuil)
  detector.processSample(0, 0, 1.3, 100);   // magnitude 1.3 (au-dessus)
  // Phase descendante
  const result = detector.processSample(0, 0, 1.0, 200);  // redescend sous seuil
  assertTrue(result.stepDetected, 'Un pas devrait etre detecte');
  assertEqual(result.stepCount, 1);
});

runner.test('detectStep: intervalle minimum entre pas', () => {
  const detector = createStepDetector(1.2);
  // Premier pas
  detector.processSample(0, 0, 1.0, 0);
  detector.processSample(0, 0, 1.3, 50);
  detector.processSample(0, 0, 1.0, 100);  // pas detecte a t=100
  // Deuxieme tentative trop rapide (< 300ms)
  detector.processSample(0, 0, 1.3, 150);
  const result = detector.processSample(0, 0, 1.0, 200);
  assertFalse(result.stepDetected, 'Pas trop rapide ne devrait pas etre detecte');
  assertEqual(result.stepCount, 1);
});

runner.test('detectStep: deux pas espaces correctement', () => {
  const detector = createStepDetector(1.2);
  // Premier pas
  detector.processSample(0, 0, 1.0, 0);
  detector.processSample(0, 0, 1.3, 50);
  detector.processSample(0, 0, 1.0, 100);
  // Deuxieme pas (apres 300ms)
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
  scheduler.schedule('Loin', 'Corps', 10000);   // scheduledTime = 1000 + 10000 = 11000
  scheduler.schedule('Proche', 'Corps', 1000);  // scheduledTime = 1001 + 1000 = 2001
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
  // Appareil a plat : accel = (0, 0, 1)
  const result = fusion.update(
    { x: 0, y: 0, z: 1 },
    { x: 0, y: 0, z: 0 },
    1000,
  );
  // pitch = atan2(0, sqrt(0+1)) = 0
  // roll = atan2(0, 1) = 0
  assertApprox(result.pitch, 0, 0.01);
  assertApprox(result.roll, 0, 0.01);
});

runner.test('sensorFusion: accel incline donne un pitch non nul', () => {
  const fusion = createSensorFusion(0.98);
  // Appareil incline vers l'avant : accel.x negatif
  const result = fusion.update(
    { x: -0.5, y: 0, z: 0.866 },
    { x: 0, y: 0, z: 0 },
    1000,
  );
  // pitch = atan2(0.5, sqrt(0 + 0.866²)) = atan2(0.5, 0.866) ≈ 0.5236 rad (30°)
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
  const fusion = createSensorFusion(0.5); // alpha faible pour voir l'effet gyro
  // Premier appel : initialise
  fusion.update({ x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: 0 }, 1000);
  // Deuxieme appel : gyro tourne a 1 rad/s pendant 100ms
  const result = fusion.update(
    { x: 0, y: 0, z: 1 },  // accel dit toujours plat
    { x: 1, y: 0, z: 0 },  // gyro tourne autour de x
    1100,                    // dt = 0.1s
  );
  // gyroPitch = 0 + 1 * 0.1 = 0.1
  // accelPitch = 0
  // fusedPitch = 0.5 * 0.1 + 0.5 * 0 = 0.05
  assertApprox(result.pitch, 0.05, 0.01);
});

runner.run();
