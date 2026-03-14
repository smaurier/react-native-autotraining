# Screencast 16 — Capteurs et notifications

## Informations
- **Duree estimee** : 16-18 min
- **Module** : `modules/16-capteurs-et-notifications.md`
- **Lab associe** : Lab 16
- **Prerequis** : Screencast 09 (navigation avancee)

## Setup
- [ ] VS Code ouvert dans un projet Expo
- [ ] Terminal integre ouvert
- [ ] Appareil physique connecte (simulateur pour le debut, physique pour les capteurs)
- [ ] Fichier `modules/16-capteurs-et-notifications.md` ouvert

## Script

### [00:00-02:00] Introduction — Les capteurs et la New Architecture

> Les smartphones sont equipes de capteurs physiques : accelerometre, gyroscope, magnetometre, barometre, podometre. Avec expo-sensors et la New Architecture, les donnees transitent par JSI (Turbo Modules) directement de C++ vers JS, sans la latence du bridge.

**Action** : Montrer le schema d'architecture (module → Turbo Module → CoreMotion/SensorManager → Hardware).

**Action** : Installer expo-sensors.

```bash
npx expo install expo-sensors
```

### [02:00-05:00] Accelerometre en temps reel

> L'accelerometre mesure l'acceleration lineaire sur 3 axes en g. Au repos, z ≈ 1g (gravite).

**Action** : Creer un composant AccelerometerScreen.

```typescript
import { Accelerometer } from 'expo-sensors';
import { useState, useEffect } from 'react';

function AccelerometerScreen() {
  const [data, setData] = useState({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    Accelerometer.setUpdateInterval(100);
    const sub = Accelerometer.addListener(setData);
    return () => sub.remove();
  }, []);

  return (
    <View>
      <Text>x: {data.x.toFixed(3)}</Text>
      <Text>y: {data.y.toFixed(3)}</Text>
      <Text>z: {data.z.toFixed(3)}</Text>
    </View>
  );
}
```

**Action** : Incliner le telephone dans differentes directions. Montrer les valeurs qui changent.

> Attention a la frequence : 100ms = 10 Hz, suffisant pour l'UI. Pour les jeux, on utiliserait 16ms (60 Hz), mais avec useRef au lieu de setState pour eviter 60 re-renders par seconde.

### [05:00-08:00] Filtre passe-bas et lissage

> Les donnees brutes du capteur sont bruitees. Un filtre passe-bas attenue les variations rapides.

**Action** : Montrer les donnees brutes qui oscillent.

**Action** : Ajouter le filtre passe-bas.

```typescript
function lowPassFilter(current, previous, alpha) {
  return {
    x: alpha * current.x + (1 - alpha) * previous.x,
    y: alpha * current.y + (1 - alpha) * previous.y,
    z: alpha * current.z + (1 - alpha) * previous.z,
  };
}
```

**Action** : Comparer alpha = 0.1 (tres lisse) et alpha = 0.8 (reactif). Montrer visuellement la difference.

> alpha proche de 0 : fort lissage, lent a reagir. alpha proche de 1 : peu de lissage, bruite. Pour une boussole, alpha = 0.1. Pour un jeu, alpha = 0.5-0.8.

### [08:00-11:00] Podometre et detection de pas

> Le Pedometer natif est plus fiable qu'une detection manuelle. Il utilise CoreMotion sur iOS et Activity Recognition sur Android.

**Action** : Utiliser Pedometer.watchStepCount.

```typescript
import { Pedometer } from 'expo-sensors';

const sub = Pedometer.watchStepCount((result) => {
  setSteps(result.steps);
});
```

**Action** : Marcher avec le telephone et montrer le compteur qui s'incremente.

> Pour comprendre le principe, voyons comment on detecterait les pas manuellement avec l'accelerometre : on calcule la magnitude, on detecte un pic au-dessus d'un seuil, puis la descente. Un intervalle minimum de 300ms evite les faux positifs.

**Action** : Montrer le createStepDetector du module.

### [11:00-14:00] Notifications locales

> Les notifications locales ne necessitent pas de serveur. On les planifie directement depuis l'app.

**Action** : Installer expo-notifications.

```bash
npx expo install expo-notifications
```

**Action** : Configurer le handler et envoyer une notification immediate.

```typescript
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

await Notifications.scheduleNotificationAsync({
  content: { title: 'Test', body: 'Notification locale !' },
  trigger: null,
});
```

**Action** : Montrer la notification qui apparait.

> Sur Android 8+, il faut creer un channel. Sans channel, la notification est silencieusement ignoree.

**Action** : Creer un channel et planifier une notification differee.

```typescript
await Notifications.setNotificationChannelAsync('reminders', {
  name: 'Rappels',
  importance: Notifications.AndroidImportance.HIGH,
});

await Notifications.scheduleNotificationAsync({
  content: { title: 'Rappel', body: 'Pensez a marcher !' },
  trigger: { type: 'timeInterval', seconds: 10, repeats: false },
});
```

### [14:00-16:00] Taches en arriere-plan

> expo-task-manager permet de definir des taches qui s'executent meme quand l'app est fermee.

**Action** : Montrer la definition de tache au niveau module.

```typescript
import * as TaskManager from 'expo-task-manager';

TaskManager.defineTask('step-sync', async ({ data, error }) => {
  if (error) return TaskManager.BackgroundFetchResult.Failed;
  // Synchroniser les pas
  return TaskManager.BackgroundFetchResult.NewData;
});
```

> Point critique : defineTask DOIT etre au niveau module, pas dans un composant. Quand le systeme relance le bundle en arriere-plan, il n'y a pas de render — seul le code au niveau module est execute.

**Action** : Montrer les limitations : intervalle minimum de 15 minutes, temps d'execution limite (~30s), Doze mode sur Android.

### [16:00-17:00] Recap

> En resume : expo-sensors utilise les Turbo Modules pour les donnees capteur basse latence. Les donnees brutes doivent etre filtrees (passe-bas, moyenne mobile). Le Pedometer natif est preferable a la detection manuelle. Les notifications locales necessitent un channel sur Android. Les taches de fond doivent etre definies au niveau module. Passez au Lab 16 pour pratiquer le traitement de donnees capteur et la planification de notifications.
