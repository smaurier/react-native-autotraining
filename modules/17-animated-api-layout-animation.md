# Module 17 — Animated API et LayoutAnimation

| Difficulte | Duree estimee | Lab | Quiz |
|------------|---------------|-----|------|
| 3/5        | 90 min        | [Lab 17](../labs/lab-17-animated-api/) | [Quiz 17](../quizzes/quiz-17-animated.html) |

## Objectifs

- Créer et manipuler des `Animated.Value`
- Maîtriser `Animated.timing` avec les courbes d'easing
- Comprendre `Animated.spring` et ses paramètres physiques
- Utiliser `Animated.decay` pour les animations basees sur la velocite
- Interpoler des valeurs avec `inputRange` / `outputRange`
- Animer en reaction au scroll avec `Animated.event`
- Combiner des animations avec parallel, sequence, stagger, loop
- Utiliser `LayoutAnimation` pour des transitions automatiques
- Comprendre `useNativeDriver` : capacites et limitations

---

## Animated.Value — la brique de base

### Concept fondamental

`Animated.Value` est un wrapper autour d'un nombre. Au lieu de stocker une valeur dans un `useState`, on la stocke dans un objet mutable qui peut etre connecte directement aux propriétés de style sans provoquer de re-render React.

```
useState(0.5)          →  re-render  →  reconciliation  →  commit  →  affichage
Animated.Value(0.5)    →  thread natif  →  affichage (bypass React)
```

### Création

```typescript
import { Animated, View, StyleSheet } from 'react-native';
import { useRef } from 'react';

function FadeInView({ children }: { children: React.ReactNode }) {
  // useRef pour que la valeur survive aux re-renders
  const opacity = useRef(new Animated.Value(0)).current;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      {children}
    </Animated.View>
  );
}
```

> **Pourquoi useRef et pas useState ?** `Animated.Value` est un objet mutable. Si on le met dans `useState`, React ne détecté pas les changements (la référence reste la même). Et surtout, on ne veut PAS que React re-rende quand la valeur change — c'est le thread natif qui anime directement.

### Lire et écrire la valeur

```typescript
const anim = useRef(new Animated.Value(0)).current;

// Ecrire sans animation
anim.setValue(1);

// Lire la valeur actuelle (callback car la valeur peut etre sur le thread natif)
anim.addListener(({ value }) => {
  console.log('Valeur actuelle :', value);
});

// Arreter l'ecoute
anim.removeAllListeners();
```

### Animated.ValueXY

Pour les animations 2D (drag, translation), `Animated.ValueXY` encapsule deux `Animated.Value` :

```typescript
const position = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

// Utilisation avec transform
<Animated.View
  style={{
    transform: position.getTranslateTransform(),
    // Equivalent a : transform: [{ translateX: position.x }, { translateY: position.y }]
  }}
/>
```

---

## Animated.timing — animations temporelles

### Principe

`Animated.timing` anime une valeur de son état actuel vers une valeur cible sur une duree donnee, en suivant une courbe d'easing.

```typescript
import { Animated, Easing } from 'react-native';

function FadeIn() {
  const opacity = useRef(new Animated.Value(0)).current;

  const fadeIn = () => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,            // 300ms
      easing: Easing.ease,      // Courbe par defaut
      useNativeDriver: true,    // Execution sur le thread natif
    }).start();
  };

  // start() accepte un callback de fin
  const fadeInWithCallback = () => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        console.log('Animation terminee');
      } else {
        console.log('Animation interrompue');
      }
    });
  };

  return (
    <Animated.View style={{ opacity }}>
      <Text>Contenu</Text>
    </Animated.View>
  );
}
```

### Courbes d'easing

Les courbes d'easing controlent la vitesse de l'animation au fil du temps. React Native fournit `Easing` avec des presets :

```typescript
import { Easing } from 'react-native';

// Lineaire : vitesse constante
Easing.linear        // f(t) = t

// Ease standard (courbe de Bezier)
Easing.ease          // Accelere puis decelere

// Entree (accelere)
Easing.in(Easing.ease)      // Lent au debut, rapide a la fin
Easing.in(Easing.quad)      // Acceleration quadratique
Easing.in(Easing.cubic)     // Acceleration cubique
Easing.in(Easing.exp)       // Acceleration exponentielle

// Sortie (decelere)
Easing.out(Easing.ease)     // Rapide au debut, lent a la fin
Easing.out(Easing.quad)
Easing.out(Easing.cubic)

// Entree-sortie (accelere puis decelere)
Easing.inOut(Easing.ease)
Easing.inOut(Easing.quad)

// Rebond
Easing.bounce               // Rebondit a l'arrivee

// Elastique
Easing.elastic(1)           // Depasse la cible puis revient

// Bezier personnalise
Easing.bezier(0.25, 0.1, 0.25, 1.0)
```

Visualisation des courbes principales :

```
linear          ease-in         ease-out        ease-in-out
   │    /          │      /        │  /            │    /‾‾
   │   /           │     /         │ /             │   /
   │  /            │    /          │/              │  /
   │ /             │  /            │               │ /
   │/              │/              │               │/
   └──────         └──────         └──────         └──────
```

### Exemples pratiques d'easing

```typescript
// Bouton presse : scale rapide avec deceleration
Animated.timing(scale, {
  toValue: 0.95,
  duration: 100,
  easing: Easing.out(Easing.cubic),
  useNativeDriver: true,
}).start();

// Modal qui apparait : slide + deceleration
Animated.timing(translateY, {
  toValue: 0,
  duration: 350,
  easing: Easing.out(Easing.exp),
  useNativeDriver: true,
}).start();

// Disparition douce
Animated.timing(opacity, {
  toValue: 0,
  duration: 200,
  easing: Easing.in(Easing.ease),
  useNativeDriver: true,
}).start();
```

---

## Animated.spring — animations physiques

### Principe

`Animated.spring` simule un ressort physique. Au lieu de spécifier une duree, vous definissez des propriétés physiques. Le résultat est une animation qui semble naturelle et organique.

```typescript
Animated.spring(value, {
  toValue: 1,
  tension: 40,       // Rigidite du ressort (defaut: 40)
  friction: 7,       // Amortissement (defaut: 7)
  useNativeDriver: true,
}).start();
```

### Parametres physiques

**Modèle tension/friction** (defaut) :
- `tension` : rigidite du ressort. Plus la tension est haute, plus le ressort est "nerveux" (oscille vite).
- `friction` : amortissement. Plus la friction est haute, moins le ressort oscille.

```typescript
// Tres rebondissant (peu de friction)
Animated.spring(scale, {
  toValue: 1,
  tension: 100,
  friction: 3,
  useNativeDriver: true,
});

// Rapide et precis (haute friction)
Animated.spring(scale, {
  toValue: 1,
  tension: 80,
  friction: 12,
  useNativeDriver: true,
});

// Lent et doux
Animated.spring(scale, {
  toValue: 1,
  tension: 20,
  friction: 5,
  useNativeDriver: true,
});
```

**Modèle masse/amortissement/rigidite** (alternatif, plus précis) :

```typescript
Animated.spring(value, {
  toValue: 1,
  mass: 1,            // Masse de l'objet (defaut: 1)
  damping: 10,        // Coefficient d'amortissement
  stiffness: 100,     // Rigidite du ressort
  useNativeDriver: true,
});
```

> **Attention** : ne melangez pas les deux modèles. Utilisez SOIT tension/friction, SOIT mass/damping/stiffness.

### Velocity

`velocity` donne une vitesse initiale au ressort. Utile après un geste (le doigt est relache avec une certaine velocite) :

```typescript
// Apres un geste de swipe
const onGestureEnd = (velocity: number) => {
  Animated.spring(translateX, {
    toValue: 0,
    velocity,           // Vitesse initiale du geste
    tension: 40,
    friction: 7,
    useNativeDriver: true,
  }).start();
};
```

### restSpeedThreshold et restDisplacementThreshold

Ces paramètres controlent quand l'animation est consideree comme terminee :

```typescript
Animated.spring(value, {
  toValue: 1,
  tension: 40,
  friction: 7,
  restSpeedThreshold: 0.001,         // Vitesse sous laquelle on arrete (defaut: 0.001)
  restDisplacementThreshold: 0.001,  // Distance de la cible sous laquelle on arrete (defaut: 0.001)
  useNativeDriver: true,
});
```

### Spring presets courants

```typescript
const SpringPresets = {
  // Bouton presse
  buttonPress: {
    tension: 100,
    friction: 10,
    useNativeDriver: true,
  },

  // Modal slide
  modalSlide: {
    tension: 65,
    friction: 11,
    useNativeDriver: true,
  },

  // Rebond doux (apparition d'element)
  gentleBounce: {
    tension: 40,
    friction: 7,
    useNativeDriver: true,
  },

  // Rapide sans rebond
  snappy: {
    tension: 150,
    friction: 20,
    useNativeDriver: true,
  },
};
```

---

## Animated.decay — deceleration naturelle

### Principe

`Animated.decay` anime une valeur en partant d'une velocite initiale et en decelerant progressivement jusqu'a l'arret. C'est le comportement d'un objet lance qui ralentit par friction.

```typescript
Animated.decay(translateX, {
  velocity: 1.5,              // Vitesse initiale (pixels/ms)
  deceleration: 0.997,        // Facteur de deceleration (defaut: 0.997)
  useNativeDriver: true,
}).start();
```

### Cas d'usage : lancer un élément

```typescript
function ThrowableCard() {
  const pan = useRef(new Animated.ValueXY()).current;
  const lastVelocity = useRef({ x: 0, y: 0 });

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,

    onPanResponderMove: Animated.event(
      [null, { dx: pan.x, dy: pan.y }],
      { useNativeDriver: false },
    ),

    onPanResponderRelease: (_, { vx, vy }) => {
      // Continuer le mouvement avec la velocite du geste
      Animated.decay(pan, {
        velocity: { x: vx, y: vy },
        deceleration: 0.995,
        useNativeDriver: true,
      }).start();
    },
  });

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[styles.card, { transform: pan.getTranslateTransform() }]}
    />
  );
}
```

### Deceleration

- `0.997` (defaut) : deceleration standard
- `0.999` : très lente (l'objet glisse longtemps)
- `0.990` : rapide (l'objet s'arrete vite)

```
deceleration = 0.999      deceleration = 0.990
┌─────────────────┐       ┌─────────────────┐
│ ●────────────●  │       │ ●────●          │
│               → │       │      (arret)    │
└─────────────────┘       └─────────────────┘
  (glisse longtemps)        (arret rapide)
```

---

## Interpolation

### Concept

L'interpolation mappe une plage de valeurs d'entree (`inputRange`) vers une plage de valeurs de sortie (`outputRange`). C'est l'outil le plus puissant de l'Animated API.

```typescript
const animValue = useRef(new Animated.Value(0)).current;

// Quand animValue va de 0 a 1,
// l'opacite va de 0 a 1 et la translation va de 50 a 0
const opacity = animValue.interpolate({
  inputRange: [0, 1],
  outputRange: [0, 1],
});

const translateY = animValue.interpolate({
  inputRange: [0, 1],
  outputRange: [50, 0],
});

<Animated.View style={{ opacity, transform: [{ translateY }] }}>
  <Text>Contenu anime</Text>
</Animated.View>
```

### Plages multiples

```typescript
// Animation en 3 phases
const backgroundColor = animValue.interpolate({
  inputRange: [0, 0.5, 1],
  outputRange: ['#FF0000', '#FFFF00', '#00FF00'], // Rouge → Jaune → Vert
});

// Scale non lineaire
const scale = animValue.interpolate({
  inputRange: [0, 0.3, 0.7, 1],
  outputRange: [1, 1.2, 0.9, 1], // Grossit, retrecit, revient
});
```

### Extrapolation

Par defaut, l'interpolation extrapole au-dela des bornes. `clamp` empeche le depassement :

```typescript
// SANS clamp : si animValue = 1.5, opacity = 1.5 (deborde)
const opacity = animValue.interpolate({
  inputRange: [0, 1],
  outputRange: [0, 1],
  extrapolate: 'extend',  // Defaut : continue la courbe
});

// AVEC clamp : si animValue = 1.5, opacity = 1 (plafonne)
const opacityClamped = animValue.interpolate({
  inputRange: [0, 1],
  outputRange: [0, 1],
  extrapolate: 'clamp',   // Bloque aux bornes
});

// Clamp unilateral
const value = animValue.interpolate({
  inputRange: [0, 1],
  outputRange: [0, 100],
  extrapolateLeft: 'clamp',    // Bloque en bas
  extrapolateRight: 'extend',  // Continue en haut
});
```

### Interpolation de couleurs

```typescript
const bgColor = animValue.interpolate({
  inputRange: [0, 1],
  outputRange: ['rgb(255, 0, 0)', 'rgb(0, 0, 255)'],
});

// ATTENTION : useNativeDriver ne supporte PAS les couleurs interpolees
// Utilisez useNativeDriver: false pour les animations de couleur
<Animated.View style={{ backgroundColor: bgColor }} />
```

### Interpolation de rotation

```typescript
const rotation = animValue.interpolate({
  inputRange: [0, 1],
  outputRange: ['0deg', '360deg'],
});

<Animated.View style={{ transform: [{ rotate: rotation }] }} />
```

---

## Animated.event — animations liees au scroll

### Principe

`Animated.event` mappe un événement natif (scroll, gesture) directement vers une `Animated.Value` sans passer par JS. Avec `useNativeDriver: true`, le mapping se fait entièrement sur le thread natif.

```typescript
function ParallaxHeader() {
  const scrollY = useRef(new Animated.Value(0)).current;

  // L'image se deplace a 50% de la vitesse du scroll
  const imageTranslateY = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, -100],
    extrapolate: 'clamp',
  });

  // Le header se reduit
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [300, 80],
    extrapolate: 'clamp',
  });

  // L'opacite du titre diminue
  const titleOpacity = scrollY.interpolate({
    inputRange: [0, 150, 200],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={{ flex: 1 }}>
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <Animated.Image
          source={require('./header.jpg')}
          style={[
            styles.headerImage,
            { transform: [{ translateY: imageTranslateY }] },
          ]}
        />
        <Animated.Text style={[styles.title, { opacity: titleOpacity }]}>
          Mon App
        </Animated.Text>
      </Animated.View>

      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16} // 60 fps
      >
        {/* Contenu scrollable */}
      </Animated.ScrollView>
    </View>
  );
}
```

> **Important** : `scrollEventThrottle={16}` est obligatoire sur iOS pour recevoir les événements scroll a 60 fps. Sans cette prop, iOS envoie les événements de scroll de manière sporadique.

### Sticky header anime

```typescript
function StickyHeaderList() {
  const scrollY = useRef(new Animated.Value(0)).current;

  // Le header se fixe en haut apres 100px de scroll
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100, 101],
    outputRange: [0, 0, 1], // Reste a 0 jusqu'a 100px, puis se deplace avec le scroll
    extrapolate: 'clamp',
  });

  const headerElevation = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 4],
    extrapolate: 'clamp',
  });

  return (
    <View style={{ flex: 1 }}>
      <Animated.View
        style={[
          styles.stickyHeader,
          {
            transform: [{ translateY: headerTranslateY }],
            elevation: headerElevation,
            shadowOpacity: headerElevation.interpolate({
              inputRange: [0, 4],
              outputRange: [0, 0.3],
            }),
          },
        ]}
      >
        <Text>Header</Text>
      </Animated.View>

      <Animated.FlatList
        data={items}
        renderItem={renderItem}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
      />
    </View>
  );
}
```

---

## Combinaison d'animations

### Animated.parallel

Execute plusieurs animations simultanement. Termine quand toutes sont finies.

```typescript
function showCard() {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  Animated.parallel([
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }),
    Animated.timing(translateY, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }),
    Animated.spring(scale, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }),
  ]).start();
}
```

### Animated.sequence

Execute les animations l'une après l'autre :

```typescript
function bounceIn() {
  const scale = useRef(new Animated.Value(0)).current;

  Animated.sequence([
    // Phase 1 : apparition rapide
    Animated.timing(scale, {
      toValue: 1.2,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }),
    // Phase 2 : retour avec rebond
    Animated.spring(scale, {
      toValue: 1,
      tension: 100,
      friction: 5,
      useNativeDriver: true,
    }),
  ]).start();
}
```

### Animated.stagger

Comme `parallel`, mais chaque animation demarre avec un delai decale :

```typescript
function staggeredListEntrance(items: Animated.Value[]) {
  Animated.stagger(
    100, // 100ms de delai entre chaque animation
    items.map((item) =>
      Animated.timing(item, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ),
  ).start();
}

// Utilisation
function StaggeredList({ data }: { data: string[] }) {
  const animations = useRef(data.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    staggeredListEntrance(animations);
  }, []);

  return (
    <View>
      {data.map((item, index) => (
        <Animated.View
          key={item}
          style={{
            opacity: animations[index],
            transform: [
              {
                translateX: animations[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, 0],
                }),
              },
            ],
          }}
        >
          <Text>{item}</Text>
        </Animated.View>
      ))}
    </View>
  );
}
```

### Animated.loop

Repete une animation indefiniment :

```typescript
// Rotation continue (indicateur de chargement)
function SpinningLoader() {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={{ transform: [{ rotate: spin }] }}>
      <Icon name="loading" size={32} />
    </Animated.View>
  );
}

// Loop avec nombre limite d'iterations
Animated.loop(
  Animated.sequence([
    Animated.timing(scale, { toValue: 1.1, duration: 500, useNativeDriver: true }),
    Animated.timing(scale, { toValue: 1.0, duration: 500, useNativeDriver: true }),
  ]),
  { iterations: 3 }, // Repete 3 fois puis s'arrete
).start();
```

---

## LayoutAnimation

### Concept

`LayoutAnimation` anime automatiquement les changements de layout au prochain cycle de rendu. Au lieu d'animer des valeurs manuellement, vous dites a React Native "anime tout changement de position/taille qui va se produire".

```typescript
import { LayoutAnimation, Platform, UIManager, View, Text, Pressable } from 'react-native';

// OBLIGATOIRE sur Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function ExpandableCard() {
  const [expanded, setExpanded] = useState(false);

  const toggle = () => {
    // Configurer l'animation AVANT le changement d'etat
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View style={styles.card}>
      <Pressable onPress={toggle}>
        <Text>Titre</Text>
      </Pressable>
      {expanded && (
        <Text style={styles.content}>
          Contenu detaille qui apparait avec une animation fluide...
        </Text>
      )}
    </View>
  );
}
```

### Presets

```typescript
// Animations predefinies
LayoutAnimation.Presets.easeInEaseOut  // Animation douce
LayoutAnimation.Presets.linear         // Lineaire
LayoutAnimation.Presets.spring         // Ressort

// Utilisation
LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
setState(newState);
```

### Configuration personnalisee

```typescript
LayoutAnimation.configureNext({
  duration: 300,
  create: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
  update: {
    type: LayoutAnimation.Types.spring,
    springDamping: 0.7,
  },
  delete: {
    type: LayoutAnimation.Types.easeOut,
    property: LayoutAnimation.Properties.opacity,
  },
});
```

Les types disponibles :
- `LayoutAnimation.Types.spring`
- `LayoutAnimation.Types.linear`
- `LayoutAnimation.Types.easeInEaseOut`
- `LayoutAnimation.Types.easeIn`
- `LayoutAnimation.Types.easeOut`
- `LayoutAnimation.Types.keyboard`

Les propriétés animables :
- `LayoutAnimation.Properties.opacity` — apparition/disparition en fondu
- `LayoutAnimation.Properties.scaleX` — mise a l'echelle horizontale
- `LayoutAnimation.Properties.scaleY` — mise a l'echelle verticale
- `LayoutAnimation.Properties.scaleXY` — mise a l'echelle uniforme

### Exemple : liste avec ajout/suppression animes

```typescript
function AnimatedList() {
  const [items, setItems] = useState(['Item 1', 'Item 2', 'Item 3']);

  const addItem = () => {
    LayoutAnimation.configureNext({
      duration: 250,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
    });
    setItems([...items, `Item ${items.length + 1}`]);
  };

  const removeItem = (index: number) => {
    LayoutAnimation.configureNext({
      duration: 200,
      delete: {
        type: LayoutAnimation.Types.easeOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
    });
    setItems(items.filter((_, i) => i !== index));
  };

  return (
    <View>
      <Pressable onPress={addItem}>
        <Text>Ajouter</Text>
      </Pressable>
      {items.map((item, index) => (
        <Pressable key={item} onPress={() => removeItem(index)}>
          <Text style={styles.listItem}>{item}</Text>
        </Pressable>
      ))}
    </View>
  );
}
```

### LayoutAnimation vs Animated

| Critere | LayoutAnimation | Animated |
|---------|-----------------|----------|
| Complexite | Très simple (1 ligne) | Plus verbose |
| Controle | Limité (preset ou config) | Total (valeur par valeur) |
| Annulation | Impossible | `animation.stop()` |
| Geste | Non | Oui |
| Performance | Bon (natif) | Excellent avec useNativeDriver |
| Android | Experimental | Stable |
| Cas d'usage | Layout changes (ajout/suppression/resize) | Tout le reste |

---

## useNativeDriver

### Comment ça marche

Avec `useNativeDriver: true`, la définition de l'animation est envoyee au thread natif au démarrage. Le thread natif exécuté l'animation frame par frame sans communiquer avec JS. Résultat : 60 fps même si le thread JS est occupe.

```
SANS useNativeDriver :
JS Thread ──[calcul]──[envoi]──[calcul]──[envoi]──  (bloque si JS occupe)
UI Thread  ────────[render]────────[render]────────

AVEC useNativeDriver :
JS Thread ──[envoi config]──(libre)────────────────
UI Thread  ──[frame]──[frame]──[frame]──[frame]──  (60 fps garantis)
```

### Proprietes supportees

`useNativeDriver: true` ne supporte que les propriétés qui ne necessitent pas de recalcul de layout :

| Supporte | Non supporte |
|----------|-------------|
| `opacity` | `width`, `height` |
| `transform.translateX/Y` | `margin*` |
| `transform.scale` | `padding*` |
| `transform.rotate` | `backgroundColor` |
| `transform.skewX/Y` | `borderRadius` |
| | `borderWidth` |
| | `left`, `top`, `right`, `bottom` |
| | `fontSize` |

```typescript
// BON — opacity et transform
Animated.timing(opacity, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true, // OK
}).start();

// ERREUR — width n'est pas supporte
Animated.timing(width, {
  toValue: 200,
  duration: 300,
  useNativeDriver: true, // CRASH : "Style property 'width' is not supported"
}).start();

// SOLUTION pour les proprietes non supportees
Animated.timing(width, {
  toValue: 200,
  duration: 300,
  useNativeDriver: false, // Fonctionne mais pas sur le thread natif
}).start();
```

### Stratégie : contourner les limitations

```typescript
// OBJECTIF : animer la largeur d'une barre de progression
// PROBLEME : width n'est pas supporte par useNativeDriver

// Solution : utiliser scaleX au lieu de width
function ProgressBar({ progress }: { progress: Animated.Value }) {
  return (
    <View style={styles.progressContainer}>
      <Animated.View
        style={[
          styles.progressBar,
          {
            transform: [
              { scaleX: progress }, // scaleX est supporte !
            ],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  progressContainer: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    transformOrigin: 'left', // React Native 0.73+
  },
});
```

---

## Projets pratiques

### 1. Card Flip

```typescript
function FlipCard({ front, back }: { front: React.ReactNode; back: React.ReactNode }) {
  const flipAnim = useRef(new Animated.Value(0)).current;
  const [isFlipped, setIsFlipped] = useState(false);

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontOpacity = flipAnim.interpolate({
    inputRange: [89, 90],
    outputRange: [1, 0],
  });

  const backOpacity = flipAnim.interpolate({
    inputRange: [89, 90],
    outputRange: [0, 1],
  });

  const flipCard = () => {
    if (isFlipped) {
      Animated.spring(flipAnim, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(flipAnim, {
        toValue: 180,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }
    setIsFlipped(!isFlipped);
  };

  return (
    <Pressable onPress={flipCard}>
      <View>
        <Animated.View
          style={[
            styles.card,
            {
              opacity: frontOpacity,
              transform: [{ rotateY: frontInterpolate }],
            },
          ]}
        >
          {front}
        </Animated.View>
        <Animated.View
          style={[
            styles.card,
            styles.cardBack,
            {
              opacity: backOpacity,
              transform: [{ rotateY: backInterpolate }],
            },
          ]}
        >
          {back}
        </Animated.View>
      </View>
    </Pressable>
  );
}
```

### 2. Staggered List Entrance

```typescript
function StaggeredList({ items }: { items: string[] }) {
  const animations = useRef(items.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(
      80,
      animations.map((anim) =>
        Animated.spring(anim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, []);

  return (
    <View style={styles.list}>
      {items.map((item, index) => {
        const translateX = animations[index].interpolate({
          inputRange: [0, 1],
          outputRange: [-100, 0],
        });

        return (
          <Animated.View
            key={item}
            style={[
              styles.listItem,
              {
                opacity: animations[index],
                transform: [{ translateX }],
              },
            ]}
          >
            <Text style={styles.listText}>{item}</Text>
          </Animated.View>
        );
      })}
    </View>
  );
}
```

### 3. Parallax Scroll Header

```typescript
function ParallaxScrollView({ imageSource, headerHeight = 300, children }) {
  const scrollY = useRef(new Animated.Value(0)).current;

  // L'image se deplace a la moitie de la vitesse du scroll (parallax)
  const imageTranslateY = scrollY.interpolate({
    inputRange: [-headerHeight, 0, headerHeight],
    outputRange: [headerHeight / 2, 0, -headerHeight / 3],
  });

  // Zoom de l'image quand on scroll vers le haut (overscroll)
  const imageScale = scrollY.interpolate({
    inputRange: [-headerHeight, 0],
    outputRange: [2, 1],
    extrapolateRight: 'clamp',
  });

  // Opacite du overlay
  const overlayOpacity = scrollY.interpolate({
    inputRange: [0, headerHeight / 2, headerHeight],
    outputRange: [0, 0.3, 0.7],
    extrapolate: 'clamp',
  });

  // Hauteur du header compact
  const headerScale = scrollY.interpolate({
    inputRange: [0, headerHeight],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  return (
    <View style={{ flex: 1 }}>
      {/* Header fixe */}
      <View style={[styles.headerContainer, { height: headerHeight }]}>
        <Animated.Image
          source={imageSource}
          style={[
            styles.headerImage,
            {
              transform: [
                { translateY: imageTranslateY },
                { scale: imageScale },
              ],
            },
          ]}
        />
        <Animated.View
          style={[styles.overlay, { opacity: overlayOpacity }]}
        />
      </View>

      {/* Contenu scrollable */}
      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingTop: headerHeight }}
      >
        {children}
      </Animated.ScrollView>
    </View>
  );
}
```

### 4. Fade Transitions entre ecrans

```typescript
function FadeTransition({ visible, children }: {
  visible: boolean;
  children: React.ReactNode;
}) {
  const opacity = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const scale = useRef(new Animated.Value(visible ? 1 : 0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: visible ? 1 : 0,
        duration: 250,
        easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: visible ? 1 : 0.95,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible]);

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ scale }],
      }}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      {children}
    </Animated.View>
  );
}
```

---

## Bonnes pratiques

### 1. Toujours préférer useNativeDriver

```typescript
// BON — 60 fps garanti
Animated.timing(opacity, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true,
}).start();

// A eviter sauf si necessaire (proprietes non supportees)
Animated.timing(width, {
  toValue: 200,
  duration: 300,
  useNativeDriver: false,
}).start();
```

### 2. Éviter les re-creations d'Animated.Value

```typescript
// MAUVAIS — cree une nouvelle valeur a chaque render
function Bad() {
  const opacity = new Animated.Value(0); // Recree a chaque render !
  // ...
}

// BON — useRef preserve la valeur
function Good() {
  const opacity = useRef(new Animated.Value(0)).current;
  // ...
}
```

### 3. Nettoyer les animations

```typescript
useEffect(() => {
  const anim = Animated.timing(opacity, {
    toValue: 1,
    duration: 300,
    useNativeDriver: true,
  });

  anim.start();

  return () => anim.stop(); // Arrete l'animation au demontage
}, []);
```

### 4. Spring > timing pour les interactions utilisateur

```typescript
// timing = mecanique, previsible (bon pour les transitions automatiques)
// spring = organique, naturel (bon pour les reactions aux gestes)

// Geste termine → spring
Animated.spring(scale, { toValue: 1, tension: 40, friction: 7, useNativeDriver: true });

// Transition d'ecran → timing
Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true });
```

### 5. Éviter LayoutAnimation + FlatList

```typescript
// ATTENTION : LayoutAnimation peut causer des bugs visuels avec FlatList
// car FlatList recycle les elements et les repositionne de maniere optimisee.
// Preferer Animated pour les listes.
```

---

## Erreurs courantes

### 1. Oublier useNativeDriver

```typescript
// MAUVAIS — animation sur le thread JS, saccade si JS est occupe
Animated.timing(value, {
  toValue: 1,
  duration: 300,
  // useNativeDriver manquant → JS thread par defaut
}).start();

// BON
Animated.timing(value, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true,
}).start();
```

### 2. Melanger native et non-native sur la même valeur

```typescript
const value = useRef(new Animated.Value(0)).current;

// ERREUR — impossible de mixer les drivers sur la meme valeur
Animated.timing(value, { toValue: 1, useNativeDriver: true }).start();
// Plus tard...
Animated.timing(value, { toValue: 0, useNativeDriver: false }).start();
// CRASH : "Attempting to run JS driven animation on animated node that has
// been driven by native animation"
```

### 3. Oublier scrollEventThrottle sur iOS

```typescript
// MAUVAIS — les animations scroll sont saccadees sur iOS
<Animated.ScrollView
  onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
    useNativeDriver: true,
  })}
>

// BON
<Animated.ScrollView
  onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
    useNativeDriver: true,
  })}
  scrollEventThrottle={16}  // 60 fps
>
```

### 4. Interpoler sans clamp

```typescript
// MAUVAIS — l'opacite peut depasser 1 ou etre negative
const opacity = scrollY.interpolate({
  inputRange: [0, 100],
  outputRange: [1, 0],
});

// BON — bloquer aux bornes
const opacity = scrollY.interpolate({
  inputRange: [0, 100],
  outputRange: [1, 0],
  extrapolate: 'clamp',
});
```

---

## Résumé

| Concept | Quand l'utiliser | useNativeDriver |
|---------|-----------------|-----------------|
| `Animated.timing` | Transitions d'ecran, fade, slide | Oui |
| `Animated.spring` | Reactions aux gestes, rebond | Oui |
| `Animated.decay` | Lancer un élément (inertie) | Oui |
| `interpolate` | Mapper une valeur vers plusieurs propriétés | Selon la propriété |
| `Animated.event` | Scroll-driven animations | Oui |
| `parallel` | Plusieurs propriétés en même temps | Oui |
| `sequence` | Étape 1 puis étape 2 | Oui |
| `stagger` | Apparition decalee d'éléments | Oui |
| `loop` | Animations infinies (loader, pulse) | Oui |
| `LayoutAnimation` | Ajout/suppression/resize de layout | N/A (natif) |

---

## Exercices

Passez au [Lab 17](../labs/lab-17-animated-api/) pour implementer des valeurs animees, des animations timing/spring, des fonctions d'easing, des sequences et des interpolations en TypeScript pur.

Puis testez vos connaissances avec le [Quiz 17](../quizzes/quiz-17-animated.html).

---

## Navigation

| Précédent | Suivant |
|:---------:|:-------:|
| [Module 16 — Capteurs et notifications](./16-capteurs-et-notifications.md) | [Module 18 — Reanimated et Gesture Handler](./18-reanimated-et-gesture-handler.md) |

---

<!-- parcours-recommande -->

::: tip Parcours recommandé
1. **Screencast** : [screencast 17 animated](../screencasts/screencast-17-animated.md)
2. **Lab** : [lab-17-animated-api](../labs/lab-17-animated-api/README)
3. **Visualisation** : [Animation Curves](../visualizations/animation-curves.html)
4. **Quiz** : [quiz 17 animated](../quizzes/quiz-17-animated.html)
:::
