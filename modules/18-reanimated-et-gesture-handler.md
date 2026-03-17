# Module 18 : Reanimated et Gesture Handler

| Metadata | Valeur |
|----------|--------|
| **Difficulte** | 4/5 |
| **Duree** | 90 min |
| **Prérequis** | Modules 01-09, bases StyleSheet/Flexbox, hooks React |
| **Lab** | [Lab 18 — Reanimated & Gestures](/labs/lab-18-reanimated-gestures/) |
| **Quiz** | [Quiz 18 — Reanimated](/quizzes/quiz-18-reanimated.html) |

---

## Objectifs du module

- Comprendre le modèle d'exécution de Reanimated 3 (worklets, UI thread)
- Maîtriser les shared values et les animated styles
- Utiliser les fonctions d'animation : timing, spring, decay, repeat, sequence
- Appliquer l'interpolation de valeurs et de couleurs
- Decouvrir la Gesture API moderne de react-native-gesture-handler
- Composer des gestes (simultaneous, exclusive, race)
- Connecter gestes et animations de manière fluide
- Implementer des layout animations (entering, exiting)
- Construire des composants interactifs complets : swipeable cards, pinch-to-zoom

> **Analogie** : Reanimated, c'est comme avoir un chorégraphe dédié sur scène (UI thread) au lieu d'envoyer les instructions depuis les coulisses (JS thread). Les worklets sont des mini-scripts que le chorégraphe exécute directement — pas besoin de traverser le rideau à chaque mouvement. C'est pour ça que les animations sont fluides à 60fps.

---

## 1. Introduction a react-native-reanimated 3

### 1.1 Pourquoi Reanimated ?

L'API `Animated` de React Native core (module 17) fonctionne bien pour des animations simples, mais elle atteint ses limites sur les interactions complexes : les gestes connectes a des animations, les interpolations multi-propriétés, les transitions interruptibles. **Reanimated 3** resout ces limites en exécutant le code d'animation directement sur le **UI thread** grace aux **worklets** — de petites fonctions JavaScript compilees et envoyees sur le thread natif, garantissant 60 fps sans aucun passage par le thread JS.

```
┌─────────────────────────────────────────────────────────┐
│                   Architecture Reanimated 3              │
├──────────────────────┬──────────────────────────────────┤
│    JS Thread         │         UI Thread                │
│                      │                                  │
│  useSharedValue(0)   │   worklet s'execute ici          │
│  useAnimatedStyle()  │   lecture/ecriture shared value  │
│  declencheurs        │   mise a jour des styles         │
│                      │   60 fps garanti                 │
├──────────────────────┴──────────────────────────────────┤
│              Shared Values (memoire partagee)            │
│         accessibles depuis les 2 threads sans bridge     │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Installation

```bash
npx expo install react-native-reanimated
```

Configuration dans `babel.config.js` :

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'], // TOUJOURS en dernier
  };
};
```

> **Important** : le plugin Babel de Reanimated doit toujours etre le **dernier** dans la liste des plugins.

### 1.3 Concept clé : les worklets

Un **worklet** est une fonction JavaScript qui peut s'exécuter sur le UI thread. Le plugin Babel transforme ces fonctions pour les serialiser et les envoyer au thread natif.

```typescript
import { runOnUI } from 'react-native-reanimated';

// Cette fonction sera executee sur le UI thread
function maFonction() {
  'worklet'; // directive obligatoire pour les fonctions standalone
  const result = Math.sin(Date.now() / 1000);
  return result;
}

// Depuis le JS thread, on peut declencher l'execution
runOnUI(maFonction)();
```

La directive `'worklet'` indique au plugin Babel de transformer la fonction. En pratique, vous l'utiliserez rarement directement — les hooks de Reanimated s'en chargent automatiquement.

---

## 2. Shared Values : le coeur de Reanimated

### 2.1 useSharedValue

Une **shared value** est une valeur accessible depuis le JS thread ET le UI thread. C'est le mécanisme de communication central de Reanimated.

```tsx
import Animated, {
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

function FadeBox() {
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value, // lecture sur le UI thread
    };
  });

  return (
    <Animated.View style={[styles.box, animatedStyle]}>
      <Text>Boite animee</Text>
    </Animated.View>
  );
}
```

**Regles fondamentales :**

| Propriété | `useSharedValue` | `useState` |
|-----------|-----------------|------------|
| Thread d'acces | JS + UI | JS uniquement |
| Re-render au changement | Non | Oui |
| Utilisation dans les styles | `useAnimatedStyle` | `style={...}` direct |
| Performant pour animations | Oui (60 fps) | Non (passe par le bridge) |

```typescript
// Modifier une shared value — PAS de re-render
opacity.value = 0.5;

// Modifier un state — re-render du composant
setOpacity(0.5);
```

> **Regle d'or** : toute valeur qui change a 60 fps (position, opacite, rotation, scale) doit etre une shared value. Reservez `useState` pour les donnees metier (texte, liste, booleans UI).

### 2.2 useAnimatedStyle

Le hook `useAnimatedStyle` créé un objet de style réactif — il se met a jour automatiquement quand les shared values utilisees changent, **sans provoquer de re-render React**.

```tsx
function ScaleBox() {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotateZ: `${rotation.value}deg` },
    ],
  }));

  const handlePress = () => {
    scale.value = scale.value === 1 ? 1.5 : 1;
    rotation.value = rotation.value === 0 ? 45 : 0;
  };

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={[styles.box, animatedStyle]} />
    </Pressable>
  );
}
```

### 2.3 useAnimatedProps

Pour animer des propriétés **non-style** (comme le `text` d'un `TextInput`, le `progress` d'un SVG, etc.), utilisez `useAnimatedProps` :

```tsx
import Animated, {
  useSharedValue,
  useAnimatedProps,
} from 'react-native-reanimated';
import { TextInput } from 'react-native';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

function AnimatedCounter() {
  const count = useSharedValue(0);

  const animatedProps = useAnimatedProps(() => ({
    text: `${Math.round(count.value)}`,
    defaultValue: `${Math.round(count.value)}`,
  }));

  return (
    <AnimatedTextInput
      animatedProps={animatedProps}
      editable={false}
      style={styles.counter}
    />
  );
}
```

> `Animated.createAnimatedComponent(Component)` transforme n'importe quel composant pour qu'il accepte des `animatedProps`.

---

## 3. Fonctions d'animation

Reanimated fournit des fonctions d'animation qui s'appliquent en assignant directement a `.value` :

### 3.1 withTiming — animation lineaire/easing

```tsx
import { withTiming, Easing } from 'react-native-reanimated';

// Animation simple (300ms par defaut)
opacity.value = withTiming(0);

// Avec configuration
opacity.value = withTiming(0, {
  duration: 500,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1),
});

// Avec callback de fin
opacity.value = withTiming(0, { duration: 300 }, (finished) => {
  'worklet';
  if (finished) {
    console.log('Animation terminee');
  }
});
```

**Easings courants :**

| Easing | Comportement |
|--------|-------------|
| `Easing.linear` | Vitesse constante |
| `Easing.ease` | Acceleration-deceleration douce |
| `Easing.bezier(x1,y1,x2,y2)` | Courbe personnalisee |
| `Easing.elastic(bounciness)` | Rebond elastique |
| `Easing.bounce` | Rebond type balle |
| `Easing.in(fn)` | Acceleration |
| `Easing.out(fn)` | Deceleration |
| `Easing.inOut(fn)` | Les deux |

### 3.2 withSpring — animation physique

`withSpring` simule un ressort physique. C'est l'animation la plus naturelle pour les interactions utilisateur.

```tsx
import { withSpring } from 'react-native-reanimated';

// Configuration par defaut (rebond naturel)
scale.value = withSpring(1.2);

// Parametrage fin
translateX.value = withSpring(100, {
  damping: 15,        // amortissement (defaut: 10) — plus haut = moins de rebond
  stiffness: 150,     // rigidite (defaut: 100) — plus haut = plus rapide
  mass: 1,            // masse (defaut: 1) — plus lourd = plus lent
  overshootClamping: false, // empecher le depassement
  velocity: 0,        // vitesse initiale
});
```

**Guide de parametrage spring :**

```
┌────────────────────────────────────────────────────┐
│              Parametres withSpring                   │
│                                                      │
│  Interaction rapide (bouton) :                       │
│    damping: 15, stiffness: 200                       │
│                                                      │
│  Rebond fun (like animation) :                       │
│    damping: 6, stiffness: 100                        │
│                                                      │
│  Mouvement lourd (drag release) :                    │
│    damping: 20, stiffness: 80, mass: 1.5             │
│                                                      │
│  Snap precis (sans rebond) :                         │
│    damping: 20, stiffness: 200, overshootClamping    │
└────────────────────────────────────────────────────┘
```

### 3.3 withDecay — animation inertielle

`withDecay` simule une deceleration naturelle, comme un objet qu'on lance et qui ralentit progressivement. Ideal après un geste de glissement.

```tsx
import { withDecay } from 'react-native-reanimated';

// Deceleration depuis la vitesse du geste
translateX.value = withDecay({
  velocity: velocityX,      // vitesse initiale (provient du geste)
  deceleration: 0.998,      // facteur de deceleration (defaut: 0.998)
  clamp: [-200, 200],       // bornes min/max optionnelles
  rubberBandEffect: true,   // rebond elastique aux bornes
  rubberBandFactor: 0.6,    // intensite du rebond (0 = rigide, 1 = libre)
});
```

### 3.4 withRepeat — répétition

```tsx
import { withRepeat, withTiming } from 'react-native-reanimated';

// Pulsation infinie
scale.value = withRepeat(
  withTiming(1.3, { duration: 600 }),
  -1,       // -1 = infini, sinon nombre de repetitions
  true,     // reverse (aller-retour)
);

// Rotation continue
rotation.value = withRepeat(
  withTiming(360, { duration: 2000, easing: Easing.linear }),
  -1,      // infini
  false,   // pas de reverse — toujours dans le meme sens
);
```

### 3.5 withSequence — enchainement

```tsx
import { withSequence, withTiming } from 'react-native-reanimated';

// Shake animation (secousse gauche-droite)
translateX.value = withSequence(
  withTiming(-10, { duration: 50 }),
  withTiming(10, { duration: 50 }),
  withTiming(-10, { duration: 50 }),
  withTiming(10, { duration: 50 }),
  withTiming(0, { duration: 50 }),
);

// Scale bounce: grossir puis revenir
scale.value = withSequence(
  withTiming(1.4, { duration: 150 }),
  withSpring(1, { damping: 6, stiffness: 200 }),
);
```

### 3.6 Combinaisons avancees

Les fonctions d'animation se composent librement :

```tsx
// Heartbeat infini : grossir, revenir, pause, repeter
scale.value = withRepeat(
  withSequence(
    withTiming(1.3, { duration: 200 }),
    withTiming(1, { duration: 200 }),
    withTiming(1.3, { duration: 200 }),
    withTiming(1, { duration: 400 }),
  ),
  -1, // infini
);

// Animation avec delai
import { withDelay } from 'react-native-reanimated';

opacity.value = withDelay(
  500, // delai en ms
  withTiming(1, { duration: 300 }),
);
```

---

## 4. Interpolation

### 4.1 interpolate — mapper des plages de valeurs

`interpolate` transforme une valeur d'une plage d'entree vers une plage de sortie. C'est essentiel pour lier plusieurs propriétés à une seule shared value.

```tsx
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

function ParallaxHeader() {
  const scrollY = useSharedValue(0);

  const headerStyle = useAnimatedStyle(() => ({
    height: interpolate(
      scrollY.value,
      [0, 200],      // plage d'entree (scroll position)
      [300, 80],      // plage de sortie (hauteur du header)
      Extrapolation.CLAMP, // bloquer aux bornes
    ),
    opacity: interpolate(
      scrollY.value,
      [0, 100, 200],  // 3 points d'entree
      [1, 0.8, 0.3],  // 3 points de sortie
      Extrapolation.CLAMP,
    ),
  }));

  return <Animated.View style={[styles.header, headerStyle]} />;
}
```

**Types d'extrapolation :**

| Type | Comportement hors plage |
|------|------------------------|
| `Extrapolation.CLAMP` | Bloque à la valeur min/max |
| `Extrapolation.EXTEND` | Continue la pente (defaut) |
| `Extrapolation.IDENTITY` | Retourne la valeur d'entree brute |

```
interpolate(valeur, inputRange, outputRange, extrapolation)

Exemple : interpolate(150, [0, 200], [0, 100], CLAMP)
  → 150 est a 75% de [0,200], donc sortie = 75% de [0,100] = 75

Avec CLAMP :
  interpolate(300, [0, 200], [0, 100], CLAMP) → 100 (bloque)

Avec EXTEND :
  interpolate(300, [0, 200], [0, 100], EXTEND) → 150 (continue)
```

### 4.2 interpolateColor — transition de couleurs

```tsx
import { interpolateColor } from 'react-native-reanimated';

function ThemeSwitch() {
  const progress = useSharedValue(0);

  const backgroundStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],                     // plage d'entree
      ['#ffffff', '#1a1a2e'],      // couleurs de sortie
    ),
  }));

  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      progress.value,
      [0, 1],
      ['#333333', '#e0e0e0'],
    ),
  }));

  const toggleTheme = () => {
    progress.value = withTiming(progress.value === 0 ? 1 : 0, {
      duration: 400,
    });
  };

  return (
    <Animated.View style={[styles.container, backgroundStyle]}>
      <Animated.Text style={[styles.text, textStyle]}>
        Theme Switch
      </Animated.Text>
      <Pressable onPress={toggleTheme}>
        <Text>Basculer</Text>
      </Pressable>
    </Animated.View>
  );
}
```

### 4.3 Exemple complet : carousel avec parallaxe

```tsx
function CarouselCard({
  index,
  scrollX,
  cardWidth,
}: {
  index: number;
  scrollX: Animated.SharedValue<number>;
  cardWidth: number;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * cardWidth,
      index * cardWidth,
      (index + 1) * cardWidth,
    ];

    return {
      transform: [
        {
          scale: interpolate(
            scrollX.value,
            inputRange,
            [0.85, 1, 0.85],
            Extrapolation.CLAMP,
          ),
        },
        {
          rotateY: `${interpolate(
            scrollX.value,
            inputRange,
            [15, 0, -15],
            Extrapolation.CLAMP,
          )}deg`,
        },
      ],
      opacity: interpolate(
        scrollX.value,
        inputRange,
        [0.6, 1, 0.6],
        Extrapolation.CLAMP,
      ),
    };
  });

  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      <Text>Carte {index + 1}</Text>
    </Animated.View>
  );
}
```

---

## 5. react-native-gesture-handler : la Gesture API

### 5.1 Pourquoi Gesture Handler ?

Le système de gestes natif de React Native (`PanResponder`) est limite :
- Difficile a composer (deux gestes simultanes)
- S'exécuté sur le JS thread → latence
- API verbeuse et peu intuitive

**react-native-gesture-handler** fournit une API declarative, composable, et executee nativement.

### 5.2 Installation

```bash
npx expo install react-native-gesture-handler
```

Envelopper l'app dans `GestureHandlerRootView` :

```tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Navigation />
    </GestureHandlerRootView>
  );
}
```

### 5.3 La Gesture API (v2 — moderne)

La **Gesture API** est l'API recommandee depuis react-native-gesture-handler v2. Elle remplace les anciens composants comme `PanGestureHandler`, `TapGestureHandler`, etc.

```tsx
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

function DraggableBox() {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd(() => {
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.box, animatedStyle]} />
    </GestureDetector>
  );
}
```

### 5.4 Types de gestes

#### Tap — appui simple ou multiple

```tsx
const tap = Gesture.Tap()
  .numberOfTaps(2) // double tap
  .maxDuration(250) // duree max d'un tap en ms
  .onStart(() => {
    'worklet';
    scale.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withSpring(1),
    );
  });
```

#### Pan — glissement

```tsx
const pan = Gesture.Pan()
  .minDistance(10) // distance min pour declencher
  .activeOffsetX([-20, 20]) // seuil d'activation horizontal
  .failOffsetY([-5, 5]) // echouer si mouvement vertical depasse 5px
  .onStart((event) => {
    'worklet';
    // Sauvegarder la position de depart
    context.value = { x: translateX.value, y: translateY.value };
  })
  .onUpdate((event) => {
    'worklet';
    translateX.value = context.value.x + event.translationX;
    translateY.value = context.value.y + event.translationY;
  })
  .onEnd((event) => {
    'worklet';
    // Utiliser la velocite pour le decay
    translateX.value = withDecay({ velocity: event.velocityX });
    translateY.value = withDecay({ velocity: event.velocityY });
  });
```

#### Pinch — pincement (zoom)

```tsx
const pinch = Gesture.Pinch()
  .onUpdate((event) => {
    'worklet';
    scale.value = savedScale.value * event.scale;
  })
  .onEnd(() => {
    'worklet';
    savedScale.value = scale.value;
    // Clamper le zoom
    if (scale.value < 1) {
      scale.value = withSpring(1);
      savedScale.value = 1;
    } else if (scale.value > 5) {
      scale.value = withSpring(5);
      savedScale.value = 5;
    }
  });
```

#### Rotation

```tsx
const rotation = Gesture.Rotation()
  .onUpdate((event) => {
    'worklet';
    rotate.value = savedRotation.value + event.rotation;
  })
  .onEnd(() => {
    'worklet';
    savedRotation.value = rotate.value;
  });
```

#### Fling — lancer rapide

```tsx
import { Directions } from 'react-native-gesture-handler';

const fling = Gesture.Fling()
  .direction(Directions.RIGHT)
  .onEnd(() => {
    'worklet';
    translateX.value = withTiming(300);
    opacity.value = withTiming(0);
  });
```

#### LongPress — appui long

```tsx
const longPress = Gesture.LongPress()
  .minDuration(500)
  .onStart(() => {
    'worklet';
    scale.value = withSpring(1.1);
    // Declencher haptic feedback via runOnJS
    runOnJS(triggerHaptic)();
  })
  .onEnd(() => {
    'worklet';
    scale.value = withSpring(1);
  });
```

### 5.5 Proprietes d'événement

Chaque geste fournit un objet `event` dans ses callbacks :

```typescript
// Pan event
interface PanGestureEvent {
  translationX: number;    // deplacement depuis le debut
  translationY: number;
  absoluteX: number;       // position absolue sur l'ecran
  absoluteY: number;
  velocityX: number;       // vitesse en px/s
  velocityY: number;
  x: number;               // position relative au composant
  y: number;
}

// Pinch event
interface PinchGestureEvent {
  scale: number;           // facteur d'echelle
  focalX: number;          // point focal X
  focalY: number;          // point focal Y
  velocity: number;        // vitesse du pincement
}
```

---

## 6. Composition de gestes

### 6.1 Gesture.Simultaneous — gestes en parallele

Permet a plusieurs gestes de s'exécuter **en même temps**. Indispensable pour le pinch-to-zoom avec rotation.

```tsx
function ZoomableImage() {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const rotate = useSharedValue(0);
  const savedRotation = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      'worklet';
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      'worklet';
      savedScale.value = scale.value;
    });

  const rotationGesture = Gesture.Rotation()
    .onUpdate((e) => {
      'worklet';
      rotate.value = savedRotation.value + e.rotation;
    })
    .onEnd(() => {
      'worklet';
      savedRotation.value = rotate.value;
    });

  const pan = Gesture.Pan()
    .minPointers(2)
    .onUpdate((e) => {
      'worklet';
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    })
    .onEnd(() => {
      'worklet';
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    });

  // Les 3 gestes s'executent en parallele
  const composed = Gesture.Simultaneous(pinch, rotationGesture, pan);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotateZ: `${rotate.value}rad` },
    ],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.Image
        source={{ uri: 'https://picsum.photos/400/400' }}
        style={[styles.image, animatedStyle]}
      />
    </GestureDetector>
  );
}
```

### 6.2 Gesture.Exclusive — un seul geste à la fois

Le **premier geste reconnu** gagne, les autres sont annules.

```tsx
const doubleTap = Gesture.Tap()
  .numberOfTaps(2)
  .onStart(() => {
    'worklet';
    scale.value = withSpring(scale.value === 1 ? 2 : 1);
  });

const singleTap = Gesture.Tap()
  .onStart(() => {
    'worklet';
    // Action de tap simple (afficher UI, etc.)
    runOnJS(toggleUI)();
  });

// Double tap est prioritaire : si detecte, le single tap est annule
const exclusive = Gesture.Exclusive(doubleTap, singleTap);
```

### 6.3 Gesture.Race — le premier gagne

Similaire a Exclusive, mais plus strict : des que le premier geste commence, les autres sont immediatement annules.

```tsx
const swipeRight = Gesture.Fling()
  .direction(Directions.RIGHT)
  .onEnd(() => {
    'worklet';
    runOnJS(goNext)();
  });

const swipeLeft = Gesture.Fling()
  .direction(Directions.LEFT)
  .onEnd(() => {
    'worklet';
    runOnJS(goPrevious)();
  });

const race = Gesture.Race(swipeRight, swipeLeft);
```

### 6.4 Tableau comparatif des compositions

| Méthode | Comportement | Cas d'usage |
|---------|-------------|-------------|
| `Simultaneous` | Tous en parallele | Pinch + Rotate + Pan |
| `Exclusive` | Premier reconnu gagne | Double tap vs Single tap |
| `Race` | Premier demarre gagne | Swipe gauche vs droite |

---

## 7. Connecter gestes et animations

### 7.1 Pattern moderne : Gesture + Shared Values

L'ancienne API `useAnimatedGestureHandler` est obsolete. La Gesture API intégré directement les callbacks worklet :

```tsx
function SwipeCard() {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const cardRotation = useSharedValue(0);

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      'worklet';
      translateX.value = event.translationX;
      translateY.value = event.translationY;
      // Rotation proportionnelle au deplacement horizontal
      cardRotation.value = interpolate(
        event.translationX,
        [-200, 0, 200],
        [-15, 0, 15],
      );
    })
    .onEnd((event) => {
      'worklet';
      const shouldDismiss = Math.abs(event.translationX) > 150;

      if (shouldDismiss) {
        const direction = event.translationX > 0 ? 1 : -1;
        translateX.value = withTiming(direction * 500, { duration: 200 });
        translateY.value = withTiming(-100, { duration: 200 });
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        cardRotation.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotateZ: `${cardRotation.value}deg` },
    ],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.swipeCard, cardStyle]}>
        <Text style={styles.cardText}>Swipe me!</Text>
      </Animated.View>
    </GestureDetector>
  );
}
```

### 7.2 Gestion du contexte (position cumulee)

Pour que les gestes s'accumulent (drag → relache → drag a nouveau depuis la dernière position), on utilise une shared value de contexte :

```tsx
function PersistentDrag() {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const contextX = useSharedValue(0);
  const contextY = useSharedValue(0);

  const pan = Gesture.Pan()
    .onStart(() => {
      'worklet';
      contextX.value = translateX.value;
      contextY.value = translateY.value;
    })
    .onUpdate((event) => {
      'worklet';
      translateX.value = contextX.value + event.translationX;
      translateY.value = contextY.value + event.translationY;
    })
    .onEnd((event) => {
      'worklet';
      // Deceleration inertielle depuis la vitesse du geste
      translateX.value = withDecay({ velocity: event.velocityX });
      translateY.value = withDecay({ velocity: event.velocityY });
    });

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.draggable, style]} />
    </GestureDetector>
  );
}
```

### 7.3 Communication UI thread → JS thread

Parfois on doit declencher du code JS (navigation, API, state) depuis un worklet :

```tsx
import { runOnJS } from 'react-native-reanimated';

function SwipeAction() {
  const translateX = useSharedValue(0);

  // Fonction JS classique
  const handleSwipeComplete = (direction: string) => {
    console.log(`Swipe ${direction}`);
    // navigation, setState, API call...
  };

  const pan = Gesture.Pan()
    .onEnd((event) => {
      'worklet';
      if (Math.abs(event.translationX) > 150) {
        const direction = event.translationX > 0 ? 'right' : 'left';
        // Appeler la fonction JS depuis le worklet
        runOnJS(handleSwipeComplete)(direction);
      }
      translateX.value = withSpring(0);
    });

  // ...
}
```

> **Regle** : `runOnJS` est nécessaire pour toute fonction qui n'est pas un worklet (setState, navigation, fetch, console.log dans certains cas).

---

## 8. Layout Animations

### 8.1 Animations d'entree et de sortie

Reanimated permet d'animer automatiquement l'apparition et la disparition des composants :

```tsx
import Animated, {
  FadeIn,
  FadeOut,
  SlideInLeft,
  SlideOutRight,
  BounceIn,
  ZoomIn,
} from 'react-native-reanimated';

function AnimatedList() {
  const [items, setItems] = useState(['A', 'B', 'C']);

  return (
    <View>
      {items.map((item, index) => (
        <Animated.View
          key={item}
          entering={FadeIn.delay(index * 100).duration(300)}
          exiting={FadeOut.duration(200)}
          style={styles.listItem}
        >
          <Text>{item}</Text>
        </Animated.View>
      ))}
    </View>
  );
}
```

### 8.2 Animations predefinies

| Categorie | Entree | Sortie |
|-----------|--------|--------|
| **Fade** | `FadeIn`, `FadeInUp`, `FadeInDown`, `FadeInLeft`, `FadeInRight` | `FadeOut`, `FadeOutUp`, etc. |
| **Slide** | `SlideInLeft`, `SlideInRight`, `SlideInUp`, `SlideInDown` | `SlideOutLeft`, etc. |
| **Zoom** | `ZoomIn`, `ZoomInRotate`, `ZoomInEasyUp` | `ZoomOut`, etc. |
| **Bounce** | `BounceIn`, `BounceInLeft`, `BounceInUp` | `BounceOut`, etc. |
| **Flip** | `FlipInXUp`, `FlipInYLeft` | `FlipOutXUp`, etc. |
| **Roll** | `RollInLeft`, `RollInRight` | `RollOutLeft`, etc. |

### 8.3 Personnalisation des animations predefinies

Chaque animation predefinie supporte un chainage fluide :

```tsx
// Enchainement fluide
<Animated.View
  entering={SlideInLeft
    .delay(200)
    .duration(400)
    .springify()
    .damping(15)
  }
  exiting={SlideOutRight.duration(300)}
/>
```

### 8.4 Layout transitions

Pour animer les **changements de position** dans une liste (reordonnancement) :

```tsx
import Animated, { Layout, FadeIn, FadeOut } from 'react-native-reanimated';

function ReorderableList() {
  const [items, setItems] = useState([1, 2, 3, 4, 5]);

  const shuffle = () => {
    setItems((prev) => [...prev].sort(() => Math.random() - 0.5));
  };

  return (
    <View>
      <Pressable onPress={shuffle}>
        <Text>Melanger</Text>
      </Pressable>
      {items.map((item) => (
        <Animated.View
          key={item}
          entering={FadeIn}
          exiting={FadeOut}
          layout={Layout.springify().damping(15)} // anime le repositionnement
          style={styles.item}
        >
          <Text>Item {item}</Text>
        </Animated.View>
      ))}
    </View>
  );
}
```

### 8.5 Custom entering/exiting animations

Pour des animations d'entree/sortie complètement personnalisees :

```tsx
import { withTiming, FadeIn } from 'react-native-reanimated';
import type { EntryAnimationsValues, ExitAnimationsValues } from 'react-native-reanimated';

// Animation d'entree personnalisee
const customEntering = (values: EntryAnimationsValues) => {
  'worklet';
  const animations = {
    opacity: withTiming(1, { duration: 300 }),
    transform: [
      { scale: withSpring(1, { damping: 12 }) },
      { rotateZ: withTiming('0deg', { duration: 400 }) },
    ],
  };
  const initialValues = {
    opacity: 0,
    transform: [
      { scale: 0.5 },
      { rotateZ: '-10deg' },
    ],
  };
  return { animations, initialValues };
};

// Animation de sortie personnalisee
const customExiting = (values: ExitAnimationsValues) => {
  'worklet';
  const animations = {
    opacity: withTiming(0, { duration: 200 }),
    transform: [
      { scale: withTiming(0.8) },
      { translateY: withTiming(50) },
    ],
  };
  const initialValues = {
    opacity: 1,
    transform: [
      { scale: 1 },
      { translateY: 0 },
    ],
  };
  return { animations, initialValues };
};

function CustomAnimatedItem() {
  return (
    <Animated.View
      entering={customEntering}
      exiting={customExiting}
      style={styles.item}
    >
      <Text>Custom animated</Text>
    </Animated.View>
  );
}
```

---

## 9. Projet pratique : Swipeable Card Stack (Tinder)

### 9.1 Architecture

```
┌─────────────────────────────────────────────┐
│                 CardStack                    │
│                                              │
│  ┌─────────────────────────────┐             │
│  │     GestureDetector (Pan)    │             │
│  │  ┌───────────────────────┐   │             │
│  │  │    Animated.View       │   │            │
│  │  │  ┌─────────────────┐   │   │            │
│  │  │  │   Card Content   │   │   │           │
│  │  │  │   - Image        │   │   │           │
│  │  │  │   - Name/Age     │   │   │           │
│  │  │  │   - Description  │   │   │           │
│  │  │  └─────────────────┘   │   │            │
│  │  └───────────────────────┘   │             │
│  └─────────────────────────────┘             │
│                                              │
│  Shared Values:                              │
│  - translateX, translateY                    │
│  - rotation (derivee de translateX)          │
│  - like/nope overlay opacity                 │
│  - carte suivante scale                      │
└─────────────────────────────────────────────┘
```

### 9.2 Implementation complete

```tsx
import React, { useState, useCallback } from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  interpolateColor,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const ROTATION_ANGLE = 15;

interface Profile {
  id: number;
  name: string;
  age: number;
  image: string;
  bio: string;
}

const PROFILES: Profile[] = [
  { id: 1, name: 'Alice', age: 28, image: 'https://picsum.photos/id/64/400/600', bio: 'Developpeuse passionnee' },
  { id: 2, name: 'Bob', age: 32, image: 'https://picsum.photos/id/65/400/600', bio: 'Designer creatif' },
  { id: 3, name: 'Claire', age: 26, image: 'https://picsum.photos/id/66/400/600', bio: 'Photographe aventuriere' },
];

function SwipeCard({
  profile,
  isFirst,
  onSwipe,
}: {
  profile: Profile;
  isFirst: boolean;
  onSwipe: (direction: 'left' | 'right') => void;
}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const handleSwipeComplete = useCallback(
    (direction: 'left' | 'right') => {
      onSwipe(direction);
    },
    [onSwipe],
  );

  const pan = Gesture.Pan()
    .enabled(isFirst)
    .onUpdate((event) => {
      'worklet';
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      'worklet';
      if (Math.abs(translateX.value) > SWIPE_THRESHOLD) {
        // Swipe valide — animer la sortie
        const direction = translateX.value > 0 ? 'right' : 'left';
        const dest = translateX.value > 0 ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;

        translateX.value = withTiming(dest, { duration: 300 }, () => {
          runOnJS(handleSwipeComplete)(direction);
        });
        translateY.value = withTiming(
          event.translationY + event.velocityY * 0.1,
          { duration: 300 },
        );
      } else {
        // Retour au centre
        translateX.value = withSpring(0, { damping: 15 });
        translateY.value = withSpring(0, { damping: 15 });
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [-ROTATION_ANGLE, 0, ROTATION_ANGLE],
      Extrapolation.CLAMP,
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotateZ: `${rotation}deg` },
      ],
    };
  });

  // Overlay "LIKE" (droite)
  const likeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  // Overlay "NOPE" (gauche)
  const nopeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.card, cardStyle]}>
        <Image source={{ uri: profile.image }} style={styles.cardImage} />
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>
            {profile.name}, {profile.age}
          </Text>
          <Text style={styles.cardBio}>{profile.bio}</Text>
        </View>

        {/* Overlay LIKE */}
        <Animated.View style={[styles.overlay, styles.likeOverlay, likeStyle]}>
          <Text style={styles.overlayText}>LIKE</Text>
        </Animated.View>

        {/* Overlay NOPE */}
        <Animated.View style={[styles.overlay, styles.nopeOverlay, nopeStyle]}>
          <Text style={styles.overlayText}>NOPE</Text>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

function CardStack() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    console.log(`Swiped ${direction}`);
    setCurrentIndex((prev) => prev + 1);
  }, []);

  return (
    <View style={styles.stackContainer}>
      {PROFILES.slice(currentIndex, currentIndex + 2)
        .reverse()
        .map((profile, index, arr) => (
          <SwipeCard
            key={profile.id}
            profile={profile}
            isFirst={index === arr.length - 1}
            onSwipe={handleSwipe}
          />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stackContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_WIDTH * 1.3,
    borderRadius: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '75%',
    resizeMode: 'cover',
  },
  cardInfo: {
    padding: 16,
  },
  cardName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  cardBio: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  overlay: {
    position: 'absolute',
    top: 50,
    padding: 10,
    borderWidth: 3,
    borderRadius: 10,
  },
  likeOverlay: {
    right: 20,
    borderColor: '#4CAF50',
  },
  nopeOverlay: {
    left: 20,
    borderColor: '#F44336',
  },
  overlayText: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
});
```

### 9.3 Carte arriere-plan animee

La carte suivante dans la pile peut s'agrandir pendant le swipe :

```tsx
function BackCard({
  profile,
  frontTranslateX,
}: {
  profile: Profile;
  frontTranslateX: Animated.SharedValue<number>;
}) {
  const backStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          Math.abs(frontTranslateX.value),
          [0, SWIPE_THRESHOLD],
          [0.9, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
    opacity: interpolate(
      Math.abs(frontTranslateX.value),
      [0, SWIPE_THRESHOLD],
      [0.5, 1],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <Animated.View style={[styles.card, backStyle]}>
      <Image source={{ uri: profile.image }} style={styles.cardImage} />
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>
          {profile.name}, {profile.age}
        </Text>
      </View>
    </Animated.View>
  );
}
```

---

## 10. Projet pratique : Pinch-to-Zoom Image Viewer

### 10.1 Implementation complete

```tsx
import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const MIN_SCALE = 1;
const MAX_SCALE = 5;

function PinchToZoom({ imageUri }: { imageUri: string }) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);

  // Geste Pinch
  const pinch = Gesture.Pinch()
    .onStart((e) => {
      'worklet';
      focalX.value = e.focalX;
      focalY.value = e.focalY;
    })
    .onUpdate((e) => {
      'worklet';
      scale.value = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE * 0.5, savedScale.value * e.scale),
      );
    })
    .onEnd(() => {
      'worklet';
      if (scale.value < MIN_SCALE) {
        scale.value = withSpring(MIN_SCALE);
        savedScale.value = MIN_SCALE;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else if (scale.value > MAX_SCALE) {
        scale.value = withSpring(MAX_SCALE);
        savedScale.value = MAX_SCALE;
      } else {
        savedScale.value = scale.value;
      }
    });

  // Geste Pan (deplacement quand zoome)
  const pan = Gesture.Pan()
    .minPointers(1)
    .maxPointers(2)
    .onStart(() => {
      'worklet';
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((e) => {
      'worklet';
      if (scale.value > 1) {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      }
    })
    .onEnd(() => {
      'worklet';
      // Limiter la translation aux bornes de l'image
      const maxTransX = ((scale.value - 1) * SCREEN_W) / 2;
      const maxTransY = ((scale.value - 1) * SCREEN_H) / 2;

      if (Math.abs(translateX.value) > maxTransX) {
        translateX.value = withSpring(
          Math.sign(translateX.value) * maxTransX,
        );
      }
      if (Math.abs(translateY.value) > maxTransY) {
        translateY.value = withSpring(
          Math.sign(translateY.value) * maxTransY,
        );
      }
    });

  // Double tap pour zoom toggle
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onStart((e) => {
      'worklet';
      if (scale.value > 1.5) {
        // Dezoom
        scale.value = withTiming(1, { duration: 300 });
        savedScale.value = 1;
        translateX.value = withTiming(0, { duration: 300 });
        translateY.value = withTiming(0, { duration: 300 });
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        // Zoom x3 centre sur le point de tap
        const targetScale = 3;
        scale.value = withTiming(targetScale, { duration: 300 });
        savedScale.value = targetScale;

        const focusX = e.x - SCREEN_W / 2;
        const focusY = e.y - SCREEN_H / 2;
        translateX.value = withTiming(-focusX * (targetScale - 1), {
          duration: 300,
        });
        translateY.value = withTiming(-focusY * (targetScale - 1), {
          duration: 300,
        });
      }
    });

  const composed = Gesture.Simultaneous(
    pinch,
    pan,
    Gesture.Exclusive(doubleTap, Gesture.Tap()),
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <View style={styles.container}>
      <GestureDetector gesture={composed}>
        <Animated.Image
          source={{ uri: imageUri }}
          style={[styles.fullImage, animatedStyle]}
          resizeMode="contain"
        />
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  fullImage: {
    width: SCREEN_W,
    height: SCREEN_H,
  },
});
```

---

## 11. Projet pratique : Draggable List

### 11.1 Concept

Une liste ou chaque élément peut etre deplace par drag & drop pour reordonner.

```tsx
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  useAnimatedReaction,
  Layout,
} from 'react-native-reanimated';

const ITEM_HEIGHT = 60;
const ITEM_MARGIN = 8;
const TOTAL_HEIGHT = ITEM_HEIGHT + ITEM_MARGIN * 2;

interface ListItem {
  id: string;
  label: string;
}

function DraggableItem({
  item,
  index,
  positions,
  onReorder,
  itemCount,
}: {
  item: ListItem;
  index: number;
  positions: Animated.SharedValue<number[]>;
  onReorder: (from: number, to: number) => void;
  itemCount: number;
}) {
  const translateY = useSharedValue(0);
  const isActive = useSharedValue(false);
  const zIndex = useSharedValue(0);

  const longPress = Gesture.LongPress()
    .minDuration(200)
    .onStart(() => {
      'worklet';
      isActive.value = true;
      zIndex.value = 100;
    });

  const pan = Gesture.Pan()
    .activateAfterLongPress(200)
    .onUpdate((event) => {
      'worklet';
      translateY.value = event.translationY;

      // Calculer la nouvelle position
      const currentPos = positions.value[index];
      const newPos = Math.round(
        (currentPos * TOTAL_HEIGHT + event.translationY) / TOTAL_HEIGHT,
      );
      const clampedPos = Math.max(0, Math.min(itemCount - 1, newPos));

      if (clampedPos !== currentPos) {
        const newPositions = [...positions.value];
        // Deplacer les autres elements
        for (let i = 0; i < newPositions.length; i++) {
          if (i === index) continue;
          if (newPositions[i] >= Math.min(currentPos, clampedPos) &&
              newPositions[i] <= Math.max(currentPos, clampedPos)) {
            newPositions[i] += currentPos < clampedPos ? -1 : 1;
          }
        }
        newPositions[index] = clampedPos;
        positions.value = newPositions;
      }
    })
    .onEnd(() => {
      'worklet';
      translateY.value = withSpring(0);
      isActive.value = false;
      zIndex.value = 0;
    });

  const composed = Gesture.Simultaneous(longPress, pan);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: isActive.value
          ? translateY.value
          : withSpring(positions.value[index] * TOTAL_HEIGHT - index * TOTAL_HEIGHT)
      },
      { scale: isActive.value ? withSpring(1.05) : withSpring(1) },
    ],
    zIndex: zIndex.value,
    shadowOpacity: isActive.value ? withSpring(0.3) : withSpring(0),
    elevation: isActive.value ? 10 : 0,
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[styles.listItem, animatedStyle]}>
        <Text style={styles.listItemText}>{item.label}</Text>
      </Animated.View>
    </GestureDetector>
  );
}

function DraggableList() {
  const items: ListItem[] = [
    { id: '1', label: 'Premier element' },
    { id: '2', label: 'Deuxieme element' },
    { id: '3', label: 'Troisieme element' },
    { id: '4', label: 'Quatrieme element' },
    { id: '5', label: 'Cinquieme element' },
  ];

  const positions = useSharedValue(items.map((_, i) => i));

  const handleReorder = useCallback((from: number, to: number) => {
    console.log(`Reorder: ${from} → ${to}`);
  }, []);

  return (
    <View style={styles.listContainer}>
      {items.map((item, index) => (
        <DraggableItem
          key={item.id}
          item={item}
          index={index}
          positions={positions}
          onReorder={handleReorder}
          itemCount={items.length}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
    padding: 16,
  },
  listItem: {
    height: ITEM_HEIGHT,
    marginVertical: ITEM_MARGIN,
    backgroundColor: '#16213e',
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  listItemText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

---

## 12. Bonnes pratiques et performance

### 12.1 Regles d'or

```
┌─────────────────────────────────────────────────────────────┐
│                   Checklist Performance                       │
│                                                               │
│  1. Utiliser useSharedValue pour TOUT ce qui bouge            │
│     (ne jamais animer avec useState)                          │
│                                                               │
│  2. useAnimatedStyle = pur worklet                            │
│     (pas de setState, pas de console.log)                     │
│                                                               │
│  3. runOnJS uniquement quand necessaire                       │
│     (navigation, setState, API calls)                         │
│                                                               │
│  4. Eviter les re-renders pendant les animations              │
│     (shared values ne provoquent pas de re-render)            │
│                                                               │
│  5. withSpring > withTiming pour les interactions             │
│     (plus naturel, pas besoin de duree)                       │
│                                                               │
│  6. Clamper les valeurs (scale, translation)                  │
│     (eviter les etats absurdes)                               │
│                                                               │
│  7. Toujours nettoyer : cancelAnimation(sharedValue)          │
│     (annuler les animations en cours avant d'en lancer)       │
└─────────────────────────────────────────────────────────────┘
```

### 12.2 Erreurs courantes

```tsx
// MAUVAIS : useState pour une animation
const [position, setPosition] = useState(0);
// Chaque mise a jour provoque un re-render complet

// BON : useSharedValue
const position = useSharedValue(0);
// Mise a jour sur le UI thread, zero re-render

// -----------------------------------------------

// MAUVAIS : style inline dans useAnimatedStyle
const style = useAnimatedStyle(() => ({
  // Ceci recree l'objet a chaque frame
  backgroundColor: pressed.value ? 'red' : 'blue',
}));

// BON : utiliser interpolateColor
const style = useAnimatedStyle(() => ({
  backgroundColor: interpolateColor(
    pressed.value,
    [0, 1],
    ['blue', 'red'],
  ),
}));

// -----------------------------------------------

// MAUVAIS : console.log dans un worklet
const pan = Gesture.Pan().onUpdate((e) => {
  'worklet';
  console.log(e.translationX); // CRASH sur certaines plateformes
});

// BON : utiliser runOnJS
const logValue = (x: number) => console.log(x);
const pan = Gesture.Pan().onUpdate((e) => {
  'worklet';
  runOnJS(logValue)(e.translationX);
});
```

### 12.3 Annuler des animations

```tsx
import { cancelAnimation } from 'react-native-reanimated';

// Annuler avant de lancer une nouvelle animation
function startNewAnimation() {
  cancelAnimation(translateX);
  cancelAnimation(translateY);
  translateX.value = withSpring(newX);
  translateY.value = withSpring(newY);
}
```

### 12.4 useDerivedValue — valeurs calculees

Pour calculer une valeur à partir d'autres shared values :

```tsx
import { useDerivedValue } from 'react-native-reanimated';

function DistanceIndicator() {
  const x = useSharedValue(0);
  const y = useSharedValue(0);

  // Se met a jour automatiquement quand x ou y changent
  const distance = useDerivedValue(() => {
    return Math.sqrt(x.value ** 2 + y.value ** 2);
  });

  const opacityStyle = useAnimatedStyle(() => ({
    opacity: interpolate(distance.value, [0, 200], [0, 1], Extrapolation.CLAMP),
  }));

  // ...
}
```

### 12.5 useAnimatedReaction — effets de bord réactifs

```tsx
import { useAnimatedReaction, runOnJS } from 'react-native-reanimated';

function ThresholdAlert() {
  const translateX = useSharedValue(0);
  const [alert, setAlert] = useState('');

  useAnimatedReaction(
    () => translateX.value, // valeur a surveiller
    (currentValue, previousValue) => {
      // Execute quand la valeur change
      if (Math.abs(currentValue) > 150 && Math.abs(previousValue ?? 0) <= 150) {
        const direction = currentValue > 0 ? 'LIKE' : 'NOPE';
        runOnJS(setAlert)(direction);
      } else if (Math.abs(currentValue) <= 150 && Math.abs(previousValue ?? 0) > 150) {
        runOnJS(setAlert)('');
      }
    },
  );

  // ...
}
```

---

## 13. Résumé et aide-mémoire

### 13.1 Hooks Reanimated

| Hook | Role |
|------|------|
| `useSharedValue(init)` | Valeur partagee JS/UI thread |
| `useAnimatedStyle(() => {})` | Style réactif (worklet) |
| `useAnimatedProps(() => {})` | Props réactives (non-style) |
| `useDerivedValue(() => val)` | Valeur calculee à partir d'autres shared values |
| `useAnimatedReaction(prep, react)` | Effet de bord quand une valeur change |

### 13.2 Fonctions d'animation

| Fonction | Role |
|----------|------|
| `withTiming(target, config)` | Animation temporelle avec easing |
| `withSpring(target, config)` | Animation physique type ressort |
| `withDecay(config)` | Deceleration inertielle |
| `withRepeat(anim, count, reverse)` | Repetition (-1 = infini) |
| `withSequence(...anims)` | Enchainement sequentiel |
| `withDelay(ms, anim)` | Delai avant animation |
| `cancelAnimation(sv)` | Annuler une animation en cours |

### 13.3 Gesture API

| Geste | Utilisation |
|-------|------------|
| `Gesture.Tap()` | Tap simple ou multiple |
| `Gesture.Pan()` | Glissement libre |
| `Gesture.Pinch()` | Pincement (zoom) |
| `Gesture.Rotation()` | Rotation a 2 doigts |
| `Gesture.Fling()` | Lancer rapide directionnel |
| `Gesture.LongPress()` | Appui long |

### 13.4 Composition de gestes

| Méthode | Quand l'utiliser |
|---------|-----------------|
| `Gesture.Simultaneous(a, b)` | Les 2 gestes en même temps |
| `Gesture.Exclusive(a, b)` | Un seul geste reconnu (priorite au premier) |
| `Gesture.Race(a, b)` | Le premier a démarrer gagne |

### 13.5 Layout Animations

```tsx
<Animated.View
  entering={FadeIn.duration(300).delay(index * 50)}
  exiting={FadeOut.duration(200)}
  layout={Layout.springify()}
/>
```

---

## Exercices du module

Rendez-vous au [Lab 18](/labs/lab-18-reanimated-gestures/) pour pratiquer les concepts vus dans ce module. Le lab simule en TypeScript pur les mécanismes internes de Reanimated et Gesture Handler : shared values, interpolation, detection de gestes, bounding, et timelines d'animation.

---

## Navigation

| Précédent | Suivant |
|:---------:|:-------:|
| [Module 17 — Animated API et LayoutAnimation](./17-animated-api-layout-animation.md) | [Module 19 — Performance et optimisation](./19-performance-et-optimisation.md) |

---

<!-- parcours-recommande -->

::: tip Parcours recommandé
1. **Screencast** : [screencast 18 reanimated](../screencasts/screencast-18-reanimated.md)
2. **Lab** : [lab-18-reanimated-gestures](../labs/lab-18-reanimated-gestures/README)
3. **Visualisation** : [Animation Curves](../visualizations/animation-curves.html)
4. **Quiz** : [quiz 18 reanimated](../quizzes/quiz-18-reanimated.html)
:::
