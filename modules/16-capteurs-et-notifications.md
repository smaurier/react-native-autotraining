# Module 16 — Capteurs et notifications

| Difficulte | Duree estimee | Lab | Quiz |
|------------|---------------|-----|------|
| 4/5        | 75 min        | [Lab 16](../labs/lab-16-capteurs-notifications/) | [Quiz 16](../quizzes/quiz-16-capteurs.html) |

## Objectifs

- Utiliser les capteurs materiels via expo-sensors (Accelerometer, Gyroscope, Magnetometer, Barometer, Pedometer)
- Traiter les donnees brutes : filtre passe-bas, moyenne mobile, detection de seuil
- Configurer les push notifications avec expo-notifications
- Planifier des notifications locales avec channels Android et categories
- Exécuter des taches en arriere-plan avec expo-task-manager et expo-background-fetch
- Construire une app podometre avec compteur de pas et alertes de notification

---

## Architecture capteurs dans React Native

### Vue d'ensemble

Les capteurs materiels sont des composants physiques du telephone qui mesurent des grandeurs physiques. React Native n'expose pas directement les capteurs natifs. Expo fournit `expo-sensors`, un module qui unifie l'acces aux capteurs iOS et Android via la New Architecture (Turbo Modules).

```
┌──────────────────────────────────────────────┐
│                  App React Native            │
│                                              │
│   useAccelerometer()   useGyroscope()        │
│   useMagnetometer()    useBarometer()        │
│   usePedometer()                             │
├──────────────────────────────────────────────┤
│              expo-sensors                     │
│         (Turbo Module / JSI)                 │
├──────────────────────────────────────────────┤
│         CoreMotion (iOS)                     │
│         SensorManager (Android)              │
├──────────────────────────────────────────────┤
│         Hardware (IMU, pression, mag.)       │
└──────────────────────────────────────────────┘
```

> **New Architecture** : expo-sensors utilise les Turbo Modules (JSI direct, pas de bridge serialise). Les donnees capteur transitent par C++ vers JS sans copie JSON. L'ancienne architecture passait par le bridge asynchrone, ce qui introduisait une latence notable sur les donnees haute frequence.

### Installation

```bash
npx expo install expo-sensors expo-notifications expo-task-manager expo-background-fetch
```

---

## Accelerometre

### Principe physique

L'accelerometre mesure l'acceleration lineaire sur trois axes (x, y, z) en g (1g = 9.81 m/s2). Au repos, l'axe perpendiculaire au sol indique environ 1g (gravite).

```
        y (+)
        ▲
        │
        │
  ──────┼──────► x (+)
        │
        │
        ▼ z (+) (vers l'ecran)
```

### Utilisation avec expo-sensors

```typescript
import { Accelerometer, AccelerometerMeasurement } from 'expo-sensors';
import { useState, useEffect } from 'react';

function AccelerometerScreen() {
  const [data, setData] = useState<AccelerometerMeasurement>({
    x: 0,
    y: 0,
    z: 0,
  });
  const [subscription, setSubscription] = useState<ReturnType<
    typeof Accelerometer.addListener
  > | null>(null);

  // Frequence de mise a jour (en millisecondes)
  Accelerometer.setUpdateInterval(100); // 10 Hz

  const subscribe = () => {
    const sub = Accelerometer.addListener((measurement) => {
      setData(measurement);
    });
    setSubscription(sub);
  };

  const unsubscribe = () => {
    subscription?.remove();
    setSubscription(null);
  };

  useEffect(() => {
    subscribe();
    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.container}>
      <Text>x: {data.x.toFixed(3)}</Text>
      <Text>y: {data.y.toFixed(3)}</Text>
      <Text>z: {data.z.toFixed(3)}</Text>
    </View>
  );
}
```

### Frequence de mise a jour

```typescript
// Haute frequence pour les jeux (60 Hz)
Accelerometer.setUpdateInterval(16);

// Frequence moyenne pour UI (10 Hz)
Accelerometer.setUpdateInterval(100);

// Basse frequence pour detection d'orientation (2 Hz)
Accelerometer.setUpdateInterval(500);
```

> **Performance** : une frequence trop elevee surcharge le thread JS. Avec la New Architecture, le Turbo Module transmet les donnees via JSI (appel synchrone C++ → JS), mais le setState provoque un re-render à chaque mesure. Privilegiez `useRef` + `requestAnimationFrame` pour les animations basees sur les capteurs.

### Vérification de disponibilité

```typescript
import { Accelerometer } from 'expo-sensors';

async function checkAvailability() {
  const isAvailable = await Accelerometer.isAvailableAsync();
  if (!isAvailable) {
    console.warn('Accelerometre non disponible sur cet appareil');
  }
  return isAvailable;
}
```

---

## Gyroscope

### Principe

Le gyroscope mesure la vitesse de rotation autour de chaque axe en radians par seconde (rad/s). Combine avec l'accelerometre, il permet de reconstituer l'orientation précisé de l'appareil.

```typescript
import { Gyroscope, GyroscopeMeasurement } from 'expo-sensors';

function useGyroscope(interval = 100) {
  const [rotation, setRotation] = useState<GyroscopeMeasurement>({
    x: 0,
    y: 0,
    z: 0,
  });

  useEffect(() => {
    Gyroscope.setUpdateInterval(interval);
    const sub = Gyroscope.addListener(setRotation);
    return () => sub.remove();
  }, [interval]);

  return rotation;
}
```

### Cas d'usage typiques

| Cas d'usage | Capteur principal | Complementaire |
|-------------|-------------------|----------------|
| Boussole | Magnetometre | Accelerometre |
| Detection de secousse | Accelerometre | - |
| Compteur de pas | Podometre (où accelerometre) | - |
| Stabilisation camera | Gyroscope | Accelerometre |
| Realite augmentee | Gyroscope + Accelerometre | Magnetometre |
| Altimetre | Barometre | - |

---

## Magnetometre

### Principe

Le magnetometre mesure le champ magnetique terrestre en microtesla (uT). Il permet de construire une boussole numérique.

```typescript
import { Magnetometer, MagnetometerMeasurement } from 'expo-sensors';

function useCompass() {
  const [heading, setHeading] = useState(0);

  useEffect(() => {
    Magnetometer.setUpdateInterval(100);
    const sub = Magnetometer.addListener((data: MagnetometerMeasurement) => {
      // Calcul de l'angle de cap (heading)
      const angle = Math.atan2(data.y, data.x) * (180 / Math.PI);
      // Normaliser entre 0 et 360
      setHeading(angle >= 0 ? angle : angle + 360);
    });
    return () => sub.remove();
  }, []);

  return heading;
}
```

### Boussole avec compensation d'inclinaison

Le magnetometre brut est sensible a l'inclinaison du telephone. Pour une boussole fiable, il faut combiner magnetometre et accelerometre (fusion de capteurs) :

```typescript
function useTiltCompensatedCompass() {
  const [heading, setHeading] = useState(0);
  const accelRef = useRef({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    Accelerometer.setUpdateInterval(100);
    const accelSub = Accelerometer.addListener((data) => {
      accelRef.current = data;
    });

    Magnetometer.setUpdateInterval(100);
    const magSub = Magnetometer.addListener((mag) => {
      const accel = accelRef.current;

      // Pitch et roll depuis l'accelerometre
      const pitch = Math.atan2(-accel.x, Math.sqrt(accel.y ** 2 + accel.z ** 2));
      const roll = Math.atan2(accel.y, accel.z);

      // Compensation d'inclinaison
      const xComp = mag.x * Math.cos(pitch) + mag.z * Math.sin(pitch);
      const yComp =
        mag.x * Math.sin(roll) * Math.sin(pitch) +
        mag.y * Math.cos(roll) -
        mag.z * Math.sin(roll) * Math.cos(pitch);

      let angle = Math.atan2(yComp, xComp) * (180 / Math.PI);
      if (angle < 0) angle += 360;

      setHeading(angle);
    });

    return () => {
      accelSub.remove();
      magSub.remove();
    };
  }, []);

  return heading;
}
```

---

## Barometre

### Principe

Le barometre mesure la pression atmospherique en hectopascals (hPa). Il permet d'estimer l'altitude relative.

```typescript
import { Barometer, BarometerMeasurement } from 'expo-sensors';

function useBarometer(interval = 1000) {
  const [pressure, setPressure] = useState<BarometerMeasurement>({
    pressure: 0,
    relativeAltitude: 0, // iOS seulement
  });

  useEffect(() => {
    Barometer.setUpdateInterval(interval);
    const sub = Barometer.addListener(setPressure);
    return () => sub.remove();
  }, [interval]);

  return pressure;
}

// Estimation d'altitude a partir de la pression (formule barometrique)
function pressureToAltitude(
  pressure: number,
  seaLevelPressure = 1013.25,
): number {
  return 44330 * (1 - Math.pow(pressure / seaLevelPressure, 1 / 5.255));
}
```

> **Attention** : `relativeAltitude` n'est disponible que sur iOS. Sur Android, utilisez la formule barometrique avec une pression de référence.

---

## Podometre

### Compteur de pas natif

Le Pedometer utilise les capteurs de mouvement integres au système (CoreMotion sur iOS, Activity Recognition sur Android). Il est bien plus précis qu'une detection manuelle via l'accelerometre.

```typescript
import { Pedometer } from 'expo-sensors';

function usePedometer() {
  const [steps, setSteps] = useState(0);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    // Verifier la disponibilite
    Pedometer.isAvailableAsync().then(setAvailable);

    // Ecouter les pas en temps reel
    const sub = Pedometer.watchStepCount((result) => {
      setSteps(result.steps);
    });

    return () => sub.remove();
  }, []);

  return { steps, available };
}
```

### Historique de pas

```typescript
async function getStepHistory(days: number): Promise<number> {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);

  const result = await Pedometer.getStepCountAsync(start, end);
  return result.steps;
}

// Exemple : pas des 7 derniers jours
const weeklySteps = await getStepHistory(7);
```

---

## Traitement des donnees capteur

### Problème des donnees brutes

Les capteurs physiques produisent des donnees bruyantes. Sans filtrage, les valeurs oscillent rapidement et rendent l'interface instable. Trois techniques fondamentales resolvent ce problème.

### Filtre passe-bas (Low-pass filter)

Le filtre passe-bas attenue les variations rapides (bruit) tout en conservant les tendances lentes (mouvement réel). Le paramètre `alpha` (entre 0 et 1) controle la force du lissage :

- `alpha` proche de 0 : lissage fort (très stable mais lent a reagir)
- `alpha` proche de 1 : lissage faible (réactif mais bruite)

```typescript
// Formule : filteredValue = alpha * newValue + (1 - alpha) * previousValue

interface Vector3D {
  x: number;
  y: number;
  z: number;
}

function lowPassFilter(
  current: Vector3D,
  previous: Vector3D,
  alpha: number,
): Vector3D {
  return {
    x: alpha * current.x + (1 - alpha) * previous.x,
    y: alpha * current.y + (1 - alpha) * previous.y,
    z: alpha * current.z + (1 - alpha) * previous.z,
  };
}

// Utilisation dans un composant
function SmoothedAccelerometer() {
  const filteredRef = useRef<Vector3D>({ x: 0, y: 0, z: 0 });
  const [display, setDisplay] = useState<Vector3D>({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    Accelerometer.setUpdateInterval(50);
    const sub = Accelerometer.addListener((raw) => {
      filteredRef.current = lowPassFilter(raw, filteredRef.current, 0.2);
      setDisplay({ ...filteredRef.current });
    });
    return () => sub.remove();
  }, []);

  return (
    <View>
      <Text>x: {display.x.toFixed(3)}</Text>
      <Text>y: {display.y.toFixed(3)}</Text>
      <Text>z: {display.z.toFixed(3)}</Text>
    </View>
  );
}
```

### Moyenne mobile (Moving average)

La moyenne mobile calcule la moyenne des N dernières valeurs. Elle est plus simple que le filtre passe-bas mais introduit un delai proportionnel à la taille de la fenêtre.

```typescript
class MovingAverage {
  private buffer: number[] = [];
  private windowSize: number;

  constructor(windowSize: number) {
    this.windowSize = windowSize;
  }

  push(value: number): number {
    this.buffer.push(value);
    if (this.buffer.length > this.windowSize) {
      this.buffer.shift();
    }
    return this.getAverage();
  }

  getAverage(): number {
    if (this.buffer.length === 0) return 0;
    const sum = this.buffer.reduce((a, b) => a + b, 0);
    return sum / this.buffer.length;
  }

  reset(): void {
    this.buffer = [];
  }
}
```

### Detection de seuil (Step detection)

La detection de pas par accelerometre repose sur l'identification des pics dans la magnitude de l'acceleration. Un pas produit un pic suivi d'un creux :

```typescript
interface StepDetectorConfig {
  threshold: number;        // Seuil de magnitude pour un pic (ex: 1.2g)
  minInterval: number;      // Intervalle minimum entre deux pas (ms)
  windowSize: number;       // Taille de la fenetre de lissage
}

function createStepDetector(config: StepDetectorConfig) {
  let stepCount = 0;
  let lastStepTime = 0;
  let lastMagnitude = 0;
  let rising = false;
  const movingAvg = new MovingAverage(config.windowSize);

  return {
    processSample(x: number, y: number, z: number, timestamp: number): boolean {
      // Magnitude de l'acceleration
      const rawMagnitude = Math.sqrt(x * x + y * y + z * z);
      const magnitude = movingAvg.push(rawMagnitude);

      let stepDetected = false;

      // Detection de pic : on monte au-dessus du seuil puis on redescend
      if (magnitude > config.threshold && !rising) {
        rising = true;
      } else if (magnitude < config.threshold && rising) {
        rising = false;
        const now = timestamp;
        if (now - lastStepTime > config.minInterval) {
          stepCount++;
          lastStepTime = now;
          stepDetected = true;
        }
      }

      lastMagnitude = magnitude;
      return stepDetected;
    },

    getStepCount(): number {
      return stepCount;
    },

    reset(): void {
      stepCount = 0;
      lastStepTime = 0;
      lastMagnitude = 0;
      rising = false;
      movingAvg.reset();
    },
  };
}
```

### Fusion de capteurs

La fusion combine accelerometre et gyroscope pour obtenir une orientation robuste. Le filtre complementaire est la méthode la plus simple :

```typescript
// Filtre complementaire : combine gyroscope (court terme) et accelerometre (long terme)
// orientation = alpha * (orientation + gyro * dt) + (1 - alpha) * accelAngle

interface FusedOrientation {
  pitch: number;  // Inclinaison avant/arriere
  roll: number;   // Inclinaison gauche/droite
}

function createSensorFusion(alpha = 0.98) {
  let orientation: FusedOrientation = { pitch: 0, roll: 0 };
  let lastTimestamp = 0;

  return {
    update(
      accel: Vector3D,
      gyro: Vector3D,
      timestamp: number,
    ): FusedOrientation {
      const dt = lastTimestamp === 0 ? 0 : (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      // Angle depuis l'accelerometre (reference a long terme)
      const accelPitch = Math.atan2(
        -accel.x,
        Math.sqrt(accel.y ** 2 + accel.z ** 2),
      );
      const accelRoll = Math.atan2(accel.y, accel.z);

      // Integration du gyroscope (court terme, derive)
      const gyroPitch = orientation.pitch + gyro.x * dt;
      const gyroRoll = orientation.roll + gyro.y * dt;

      // Filtre complementaire
      orientation = {
        pitch: alpha * gyroPitch + (1 - alpha) * accelPitch,
        roll: alpha * gyroRoll + (1 - alpha) * accelRoll,
      };

      return { ...orientation };
    },

    getOrientation(): FusedOrientation {
      return { ...orientation };
    },

    reset(): void {
      orientation = { pitch: 0, roll: 0 };
      lastTimestamp = 0;
    },
  };
}
```

---

## Push notifications avec expo-notifications

### Architecture des push notifications

```
┌────────────┐    ┌──────────────┐    ┌───────────────┐    ┌──────────┐
│   Serveur  │───►│ Expo Push    │───►│ APNs / FCM    │───►│ Appareil │
│   Backend  │    │ Service      │    │               │    │          │
└────────────┘    └──────────────┘    └───────────────┘    └──────────┘
                        │                                       │
                        └── ExpoPushToken ──────────────────────┘
```

1. L'app obtient un **ExpoPushToken** unique pour l'appareil
2. Le token est envoye au backend
3. Le backend envoie les notifications via l'API Expo Push
4. Expo Push relaye vers APNs (iOS) ou FCM (Android)
5. Le système affiche la notification sur l'appareil

### Configuration

```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configuration du comportement quand l'app est au premier plan
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    // priority sur Android
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});
```

### Obtenir le push token

```typescript
async function registerForPushNotifications(): Promise<string | null> {
  // Les notifications ne fonctionnent pas sur simulateur
  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device');
    return null;
  }

  // Verifier et demander les permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Permission not granted for push notifications');
    return null;
  }

  // Channel Android (obligatoire depuis Android 8.0)
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  // Obtenir le token
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: 'your-project-id', // Constants.expoConfig?.extra?.eas?.projectId
  });

  return tokenData.data;
}
```

### Ecouter les notifications

```typescript
function useNotificationListeners() {
  const notificationRef = useRef<Notifications.Subscription>();
  const responseRef = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Notification recue pendant que l'app est au premier plan
    notificationRef.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        const { title, body, data } = notification.request.content;
        console.log('Notification recue :', title, body, data);
      },
    );

    // L'utilisateur a tape sur la notification
    responseRef.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const { data } = response.notification.request.content;
        // Naviguer vers l'ecran correspondant
        if (data.screen) {
          navigation.navigate(data.screen as string, data.params);
        }
      });

    return () => {
      notificationRef.current?.remove();
      responseRef.current?.remove();
    };
  }, []);
}
```

### Envoyer depuis le backend

```typescript
// Cote serveur (Node.js)
async function sendPushNotification(
  expoPushToken: string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data: data ?? {},
    // Android : channel
    channelId: 'default',
    // iOS : badge
    badge: 1,
  };

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  return response.json();
}
```

---

## Notifications locales

### Planification immediate

```typescript
async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data ?? {},
      sound: 'default',
    },
    trigger: null, // Immediatement
  });
}
```

### Planification differee

```typescript
// Dans N secondes
async function scheduleInSeconds(title: string, body: string, seconds: number) {
  const id = await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      repeats: false,
    },
  });
  return id;
}

// A une date precise
async function scheduleAtDate(title: string, body: string, date: Date) {
  const id = await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
    },
  });
  return id;
}

// Notification recurrente (chaque jour a 8h)
async function scheduleDailyReminder(title: string, body: string) {
  const id = await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 8,
      minute: 0,
    },
  });
  return id;
}
```

### Channels Android

Les channels (canaux) sont obligatoires depuis Android 8.0 (API 26). Chaque channel a sa propre configuration de son, vibration et importance.

```typescript
async function setupNotificationChannels() {
  if (Platform.OS !== 'android') return;

  // Channel pour les alertes urgentes
  await Notifications.setNotificationChannelAsync('alerts', {
    name: 'Alertes',
    description: 'Alertes importantes qui necessitent une attention immediate',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 500, 200, 500],
    lightColor: '#FF0000',
    sound: 'alert.wav',
    enableVibrate: true,
    enableLights: true,
  });

  // Channel pour les rappels quotidiens
  await Notifications.setNotificationChannelAsync('reminders', {
    name: 'Rappels',
    description: 'Rappels quotidiens pour les objectifs',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
  });

  // Channel silencieux pour les mises a jour
  await Notifications.setNotificationChannelAsync('updates', {
    name: 'Mises a jour',
    description: 'Mises a jour silencieuses en arriere-plan',
    importance: Notifications.AndroidImportance.LOW,
    enableVibrate: false,
    enableLights: false,
  });
}
```

### Categories de notification (actions)

Les categories permettent d'ajouter des boutons d'action directement dans la notification.

```typescript
async function setupNotificationCategories() {
  await Notifications.setNotificationCategoryAsync('fitness', [
    {
      identifier: 'DISMISS',
      buttonTitle: 'Ignorer',
      options: { isDestructive: true },
    },
    {
      identifier: 'VIEW_DETAILS',
      buttonTitle: 'Voir les details',
      options: { opensAppToForeground: true },
    },
    {
      identifier: 'QUICK_LOG',
      buttonTitle: 'Enregistrer',
      options: { opensAppToForeground: false },
      textInput: {
        submitButtonTitle: 'Envoyer',
        placeholder: 'Nombre de pas...',
      },
    },
  ]);
}

// Utiliser la categorie
await Notifications.scheduleNotificationAsync({
  content: {
    title: 'Objectif atteint !',
    body: 'Vous avez fait 10 000 pas aujourd\'hui',
    categoryIdentifier: 'fitness',
  },
  trigger: null,
});
```

### Gestion des notifications planifiees

```typescript
// Lister toutes les notifications planifiees
async function getScheduledNotifications() {
  return await Notifications.getAllScheduledNotificationsAsync();
}

// Annuler une notification specifique
async function cancelNotification(id: string) {
  await Notifications.cancelScheduledNotificationAsync(id);
}

// Annuler toutes les notifications
async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Verifier combien de notifications sont planifiees
async function getScheduledCount(): Promise<number> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.length;
}
```

---

## Taches en arriere-plan

### expo-task-manager

`expo-task-manager` permet de définir des taches qui s'executent même quand l'app est en arriere-plan ou terminee. **Important** : la définition de la tache (TaskManager.defineTask) doit etre faite au niveau module (hors composant) et dans un fichier charge au démarrage.

```typescript
import * as TaskManager from 'expo-task-manager';

const BACKGROUND_FETCH_TASK = 'background-step-sync';

// Definir la tache AU NIVEAU MODULE (pas dans un composant)
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Background task error:', error);
    return TaskManager.BackgroundFetchResult.Failed;
  }

  try {
    // Synchroniser les donnees de pas avec le serveur
    const steps = await getLocalStepCount();
    await syncStepsToServer(steps);

    return TaskManager.BackgroundFetchResult.NewData;
  } catch (err) {
    console.error('Sync failed:', err);
    return TaskManager.BackgroundFetchResult.Failed;
  }
});
```

### expo-background-fetch

```typescript
import * as BackgroundFetch from 'expo-background-fetch';

async function registerBackgroundFetch() {
  // Verifier si background fetch est disponible
  const status = await BackgroundFetch.getStatusAsync();

  if (status === BackgroundFetch.BackgroundFetchStatus.Denied) {
    console.warn('Background fetch est desactive par l\'utilisateur');
    return;
  }

  if (status === BackgroundFetch.BackgroundFetchStatus.Restricted) {
    console.warn('Background fetch est restreint par le systeme');
    return;
  }

  // Enregistrer la tache
  await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
    minimumInterval: 15 * 60, // 15 minutes minimum
    stopOnTerminate: false,    // Continue apres fermeture de l'app (Android)
    startOnBoot: true,         // Demarre au redemarrage du telephone (Android)
  });

  console.log('Background fetch enregistre');
}

// Verifier si la tache est enregistree
async function isTaskRegistered(): Promise<boolean> {
  return await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
}

// Desenregistrer la tache
async function unregisterBackgroundFetch() {
  await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
}
```

### Limitations importantes

| Plateforme | Limitation |
|------------|-----------|
| iOS | Background fetch exécuté "a l'opportunite du système" — pas de garantie d'intervalle exact |
| iOS | L'app peut etre tuee si elle utilise trop de ressources en arriere-plan |
| Android | Doze mode et App Standby limitent la frequence des taches |
| Android | `stopOnTerminate: false` nécessité un foreground service pour garantir l'exécution |
| Les deux | Les taches en arriere-plan ont un temps d'exécution limite (~30 secondes) |

---

## Projet pratique : App podometre avec notifications

### Architecture du projet

```
StepTrackerApp/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx          # Dashboard avec pas du jour
│   │   ├── history.tsx        # Historique des pas
│   │   └── settings.tsx       # Parametres et objectifs
│   └── _layout.tsx
├── components/
│   ├── StepCounter.tsx        # Cercle de progression
│   ├── StepChart.tsx          # Graphique d'historique
│   └── GoalSetting.tsx        # Configuration d'objectif
├── hooks/
│   ├── usePedometer.ts        # Acces au podometre
│   ├── useStepGoal.ts         # Gestion de l'objectif
│   └── useNotifications.ts    # Setup des notifications
├── services/
│   ├── stepStorage.ts         # Persistance AsyncStorage
│   ├── notifications.ts       # Planification des notifications
│   └── backgroundSync.ts      # Tache de synchronisation
└── utils/
    ├── sensorFilters.ts       # lowPassFilter, movingAverage
    └── stepDetection.ts       # Detection de pas manuelle
```

### Composant StepCounter

```typescript
import { Pedometer } from 'expo-sensors';
import { useEffect, useState, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface StepCounterProps {
  goal: number;
}

function StepCounter({ goal }: StepCounterProps) {
  const [steps, setSteps] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const sub = Pedometer.watchStepCount((result) => {
      setSteps(result.steps);

      // Animer la progression
      const pct = Math.min(result.steps / goal, 1);
      Animated.spring(progress, {
        toValue: pct,
        useNativeDriver: false, // SVG ne supporte pas native driver
        tension: 40,
        friction: 7,
      }).start();
    });

    return () => sub.remove();
  }, [goal]);

  const percentage = Math.min(Math.round((steps / goal) * 100), 100);

  return (
    <View style={styles.container}>
      <Svg width={200} height={200}>
        {/* Cercle de fond */}
        <Circle
          cx={100}
          cy={100}
          r={80}
          stroke="#E0E0E0"
          strokeWidth={12}
          fill="none"
        />
        {/* Cercle de progression */}
        <AnimatedCircle
          cx={100}
          cy={100}
          r={80}
          stroke="#4CAF50"
          strokeWidth={12}
          fill="none"
          strokeDasharray={`${2 * Math.PI * 80}`}
          strokeDashoffset={progress.interpolate({
            inputRange: [0, 1],
            outputRange: [2 * Math.PI * 80, 0],
          })}
          strokeLinecap="round"
          transform="rotate(-90 100 100)"
        />
      </Svg>
      <View style={styles.textContainer}>
        <Text style={styles.steps}>{steps.toLocaleString()}</Text>
        <Text style={styles.goal}>/ {goal.toLocaleString()} pas</Text>
        <Text style={styles.percentage}>{percentage}%</Text>
      </View>
    </View>
  );
}
```

### Service de notifications fitness

```typescript
import * as Notifications from 'expo-notifications';

interface StepGoalConfig {
  dailyGoal: number;
  morningReminder: boolean;
  goalReachedAlert: boolean;
  inactivityAlert: boolean;
  inactivityMinutes: number;
}

async function setupFitnessNotifications(config: StepGoalConfig) {
  // Rappel matinal
  if (config.morningReminder) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Bonne journee !',
        body: `Objectif du jour : ${config.dailyGoal.toLocaleString()} pas. C'est parti !`,
        categoryIdentifier: 'fitness',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 8,
        minute: 0,
      },
    });
  }

  // Alerte mi-journee si objectif < 50%
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Continuez !',
      body: 'Vous etes a mi-parcours. Un peu de marche ?',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 14,
      minute: 0,
    },
  });
}

// Notification quand l'objectif est atteint
async function notifyGoalReached(steps: number, goal: number) {
  if (steps >= goal) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Objectif atteint !',
        body: `Felicitations ! Vous avez fait ${steps.toLocaleString()} pas.`,
        data: { screen: 'history' },
      },
      trigger: null,
    });
  }
}
```

### Tache de fond pour le suivi

```typescript
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STEP_SYNC_TASK = 'step-sync-task';

TaskManager.defineTask(STEP_SYNC_TASK, async () => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Recuperer les pas du jour
    const end = new Date();
    const start = new Date(today);
    const { steps } = await Pedometer.getStepCountAsync(start, end);

    // Sauvegarder localement
    const history = JSON.parse(
      (await AsyncStorage.getItem('step-history')) ?? '{}',
    );
    history[today] = steps;
    await AsyncStorage.setItem('step-history', JSON.stringify(history));

    // Verifier l'objectif
    const goal = parseInt(
      (await AsyncStorage.getItem('daily-goal')) ?? '10000',
      10,
    );
    if (steps >= goal) {
      await notifyGoalReached(steps, goal);
    }

    return TaskManager.BackgroundFetchResult.NewData;
  } catch {
    return TaskManager.BackgroundFetchResult.Failed;
  }
});

async function startBackgroundStepSync() {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(STEP_SYNC_TASK);
  if (!isRegistered) {
    await BackgroundFetch.registerTaskAsync(STEP_SYNC_TASK, {
      minimumInterval: 30 * 60, // 30 minutes
      stopOnTerminate: false,
      startOnBoot: true,
    });
  }
}
```

---

## Bonnes pratiques

### Performance des capteurs

```typescript
// 1. Toujours se desabonner dans le cleanup
useEffect(() => {
  const sub = Accelerometer.addListener(handleData);
  return () => sub.remove(); // OBLIGATOIRE
}, []);

// 2. Utiliser useRef pour les calculs intermediaires (eviter les re-renders)
const dataRef = useRef({ x: 0, y: 0, z: 0 });
Accelerometer.addListener((data) => {
  dataRef.current = data;
  // Mettre a jour l'UI seulement quand necessaire
});

// 3. Debouncer les mises a jour d'etat
const lastUpdateRef = useRef(0);
Accelerometer.addListener((data) => {
  const now = Date.now();
  if (now - lastUpdateRef.current > 100) { // Max 10 Hz pour l'UI
    setState(data);
    lastUpdateRef.current = now;
  }
});
```

### Gestion des permissions

```typescript
import * as Notifications from 'expo-notifications';
import { Pedometer } from 'expo-sensors';

async function checkAllPermissions(): Promise<{
  notifications: boolean;
  pedometer: boolean;
}> {
  const [notifPerm, pedometerAvail] = await Promise.all([
    Notifications.getPermissionsAsync(),
    Pedometer.isAvailableAsync(),
  ]);

  return {
    notifications: notifPerm.status === 'granted',
    pedometer: pedometerAvail,
  };
}
```

### Gestion de batterie

```typescript
// Adapter la frequence selon l'usage
function adaptSensorFrequency(isActive: boolean) {
  if (isActive) {
    // L'utilisateur regarde l'ecran — haute frequence
    Accelerometer.setUpdateInterval(50);  // 20 Hz
  } else {
    // Ecran eteint ou app en arriere-plan — basse frequence
    Accelerometer.setUpdateInterval(1000); // 1 Hz
  }
}

// Reagir a l'etat de l'app
import { AppState } from 'react-native';

useEffect(() => {
  const sub = AppState.addEventListener('change', (state) => {
    adaptSensorFrequency(state === 'active');
  });
  return () => sub.remove();
}, []);
```

---

## Erreurs courantes

### 1. Oublier de se desabonner

```typescript
// MAUVAIS — fuite memoire
useEffect(() => {
  Accelerometer.addListener(setData);
}, []);

// BON
useEffect(() => {
  const sub = Accelerometer.addListener(setData);
  return () => sub.remove();
}, []);
```

### 2. Frequence trop elevee sans optimisation

```typescript
// MAUVAIS — 60 setState/seconde = lag
Accelerometer.setUpdateInterval(16);
Accelerometer.addListener((data) => {
  setState(data); // 60 re-renders par seconde
});

// BON — ref + throttle
const dataRef = useRef(data);
Accelerometer.addListener((d) => { dataRef.current = d; });
// Mettre a jour l'UI via requestAnimationFrame ou intervalle
```

### 3. Push token sans vérification Device.isDevice

```typescript
// MAUVAIS — crash sur simulateur
const token = await Notifications.getExpoPushTokenAsync();

// BON — verifier d'abord
if (!Device.isDevice) {
  console.warn('Push notifications need a physical device');
  return;
}
const token = await Notifications.getExpoPushTokenAsync({ projectId });
```

### 4. Channel Android manquant

```typescript
// MAUVAIS — notification silencieuse ou invisible sur Android 8+
await Notifications.scheduleNotificationAsync({
  content: { title: 'Hello', body: 'World' },
  trigger: null,
});

// BON — creer le channel d'abord
if (Platform.OS === 'android') {
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    importance: Notifications.AndroidImportance.HIGH,
  });
}
```

### 5. Background task dans un composant

```typescript
// MAUVAIS — defini dans un composant (peut etre appele plusieurs fois)
function App() {
  TaskManager.defineTask('my-task', async () => { ... });
}

// BON — defini au niveau module
TaskManager.defineTask('my-task', async () => { ... });

function App() {
  // Seulement l'enregistrement ici
  useEffect(() => {
    BackgroundFetch.registerTaskAsync('my-task', { minimumInterval: 900 });
  }, []);
}
```

---

## Résumé

| Concept | API | Point clé |
|---------|-----|-----------|
| Accelerometre | `Accelerometer.addListener` | Toujours cleanup, adapter la frequence |
| Gyroscope | `Gyroscope.addListener` | Combine avec accelerometre pour fusion |
| Magnetometre | `Magnetometer.addListener` | Compenser l'inclinaison pour boussole |
| Barometre | `Barometer.addListener` | `relativeAltitude` iOS seulement |
| Podometre | `Pedometer.watchStepCount` | Plus fiable que detection manuelle |
| Filtre passe-bas | `alpha * new + (1-alpha) * old` | alpha petit = plus lisse |
| Moyenne mobile | Fenetre de N valeurs | Simple mais ajoute du delai |
| Push token | `getExpoPushTokenAsync` | Appareil physique obligatoire |
| Notification locale | `scheduleNotificationAsync` | Channels obligatoires sur Android |
| Background fetch | `registerTaskAsync` | defineTask au niveau module |

---

## Exercices

Passez au [Lab 16](../labs/lab-16-capteurs-notifications/) pour implementer un filtre passe-bas, une moyenne mobile, un detecteur de pas, un planificateur de notifications et une fusion de capteurs en TypeScript pur.

Puis testez vos connaissances avec le [Quiz 16](../quizzes/quiz-16-capteurs.html).

---

<!-- parcours-recommande -->

::: tip Parcours recommandé
1. **Screencast** : [screencast 16 capteurs](../screencasts/screencast-16-capteurs.md)
2. **Lab** : [lab-16-capteurs-notifications](../labs/lab-16-capteurs-notifications/README)
3. **Quiz** : [quiz 16 capteurs](../quizzes/quiz-16-capteurs.html)
:::
